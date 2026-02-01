import "./broker_nft_messages.tact";

// Broker NFT Collection + Items (TEP-62 style, based on community template).
// This is suitable for "Broker NFT" representation: each minted item holds a metadata Cell/URI.

const minTonsForStorage: Int = ton("0.02");
const gasConsumption: Int = ton("0.02");

message MintBroker {
    to: Address;
    // Off-chain metadata pointer, usually a URI cell (or JSON cell if you want on-chain metadata).
    // This becomes the NFT item’s `individual_content`.
    metadata: Cell;
}

contract BrokerNftCollection {
    next_item_index: Int as uint32 = 0;
    owner_address: Address;
    royalty_params: RoyaltyParams?;
    collection_content: Cell;

    init(owner_address: Address, collection_content: Cell, royalty_params: RoyaltyParams) {
        self.owner_address = owner_address;
        self.collection_content = collection_content;
        self.royalty_params = royalty_params;
    }

    receive() {
        cashback(sender());
    }

    // Owner-only mint. The attached value is used to deploy + transfer the NFT item.
    receive(msg: MintBroker) {
        require(sender() == self.owner_address, "Not owner");

        let ctx: Context = context();
        let msgValue: Int = ctx.value;

        let tonBalanceBeforeMsg: Int = myBalance() - msgValue;
        let storageFee: Int = minTonsForStorage - min(tonBalanceBeforeMsg, minTonsForStorage);
        msgValue = msgValue - (storageFee + gasConsumption);

        self.mint(msg.to, msg.metadata, msgValue);

        emit(
            LogEventMintRecord{
                minter: sender(),
                item_id: self.next_item_index,
                generate_number: nativeRandom(),
            }
                .toCell()
        );
    }

    fun mint(recipient: Address, metadata: Cell, msgValue: Int) {
        require(self.next_item_index >= 0, "non-sequential NFTs");
        let nft_init: StateInit = self.getNftItemInit(self.next_item_index);
        send(SendParameters{
            to: contractAddress(nft_init),
            value: msgValue,
            bounce: false,
            mode: SendIgnoreErrors,
            body: Transfer{
                query_id: 0,
                new_owner: recipient,
                response_destination: self.owner_address,
                custom_payload: metadata,
                forward_amount: 0,
                forward_payload: emptySlice(),
            }.toCell(),
            code: nft_init.code,
            data: nft_init.data,
        });
        self.next_item_index = self.next_item_index + 1;
    }

    receive(msg: GetRoyaltyParams) {
        let ctx: Context = context();
        send(SendParameters{
            to: ctx.sender,
            value: 0,
            mode: 64,
            bounce: false,
            body: ReportRoyaltyParams{
                query_id: msg.query_id,
                numerator: (self.royalty_params!!).numerator,
                denominator: (self.royalty_params!!).denominator,
                destination: self.owner_address,
            }.toCell(),
        });
    }

    // ---- Getters ----

    get fun get_collection_data(): CollectionData {
        return CollectionData{
            next_item_index: self.next_item_index,
            collection_content: self.collection_content,
            owner_address: self.owner_address,
        };
    }

    get fun get_nft_address_by_index(item_index: Int): Address? {
        let initCode: StateInit = self.getNftItemInit(item_index);
        return contractAddress(initCode);
    }

    get fun getNftItemInit(item_index: Int): StateInit {
        return initOf BrokerNftItem(myAddress(), item_index);
    }

    get fun get_nft_content(_index: Int, individual_content: Cell): Cell {
        // For off-chain metadata, `individual_content` should be a URI cell.
        return individual_content;
    }

    get fun royalty_params(): RoyaltyParams {
        return self.royalty_params!!;
    }
}

contract BrokerNftItem {
    collection_address: Address;
    item_index: Int;
    is_initialized: Bool;

    owner: Address?;
    individual_content: Cell?;

    init(collection_address: Address, item_index: Int) {
        require(sender() == collection_address, "not from collection");
        self.collection_address = collection_address;
        self.item_index = item_index;
        self.is_initialized = false;
    }

    receive(msg: Transfer) {
        let ctx: Context = context();
        let msgValue: Int = self.msgValue(ctx.value);

        if (self.is_initialized == false) {
            // Initial transfer = mint
            require(ctx.sender == self.collection_address, "initialized tx need from collection");
            self.is_initialized = true;
            self.owner = msg.new_owner;
            self.individual_content = msg.custom_payload;
            send(SendParameters{
                to: msg.response_destination!!,
                value: msgValue,
                mode: SendPayGasSeparately,
                body: Excesses{ query_id: msg.query_id }.toCell(),
            });
        } else {
            require(ctx.sender == self.owner!!, "not owner");
            self.owner = msg.new_owner;

            if (msg.forward_amount > 0) {
                send(SendParameters{
                    to: msg.new_owner,
                    value: msg.forward_amount,
                    mode: SendPayGasSeparately,
                    bounce: true,
                    body: OwnershipAssigned{
                        query_id: msg.query_id,
                        prev_owner: ctx.sender,
                        forward_payload: msg.forward_payload,
                    }.toCell(),
                });
            }

            msgValue = msgValue - ctx.readForwardFee();
            if (msg.response_destination != null) {
                send(SendParameters{
                    to: msg.response_destination!!,
                    value: msgValue - msg.forward_amount,
                    mode: SendPayGasSeparately,
                    bounce: true,
                    body: Excesses{ query_id: msg.query_id }.toCell(),
                });
            }
        }
    }

    receive(msg: GetStaticData) {
        let ctx: Context = context();
        send(SendParameters{
            to: ctx.sender,
            value: 0,
            mode: 64,
            bounce: true,
            body: ReportStaticData{
                query_id: msg.query_id,
                index_id: self.item_index,
                collection: self.collection_address,
            }.toCell(),
        });
    }

    fun msgValue(value: Int): Int {
        let tonBalanceBeforeMsg: Int = myBalance() - value;
        let storageFee: Int = minTonsForStorage - min(tonBalanceBeforeMsg, minTonsForStorage);
        return value - (storageFee + gasConsumption);
    }

    get fun get_nft_data(): GetNftData {
        return GetNftData{
            is_initialized: self.is_initialized,
            index: self.item_index,
            collection_address: self.collection_address,
            owner_address: self.owner!!,
            individual_content: (self.individual_content!!),
        };
    }
}

