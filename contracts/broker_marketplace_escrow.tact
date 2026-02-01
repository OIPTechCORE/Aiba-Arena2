import "@stdlib/ownable";
import "./jetton_messages.tact";
import "./jetton_default_wallet.tact";
import "./broker_nft_messages.tact";
import "./broker_nft.tact";

// Minimal on-chain escrow marketplace for Broker NFTs (testnet baseline).
// Flow:
// - Seller transfers Broker NFT item to this contract with forward_payload containing price (coins).
// - Contract validates the NFT item via get_static_data and stores a listing.
// - Buyer pays AIBA Jettons to the contract's Jetton wallet with forwardPayload containing listingId.
// - Buyer calls FinalizePurchase(listingId) to receive NFT; contract forwards jettons to seller minus fee.

message FinalizePurchase {
    listingId: Int as uint64;
}

// Buyer can reclaim their jettons if a purchase finalization failed (e.g. NFT transfer bounced)
// and the listing is active again.
message RefundPayment {
    listingId: Int as uint64;
}

// Seller -> NFT item Transfer forward_payload: storeCoins(price)
struct PendingListing {
    seller: Address;
    price: Int as coins;
}

struct Listing {
    nftItem: Address;
    seller: Address;
    price: Int as coins;
    active: Bool;
}

// Nested map helper (buyer -> (listingId -> amountPaid))
struct PaymentMap {
    unbox: map<Int as uint64, Int as coins>;
}

contract BrokerMarketplaceEscrow with Ownable {
    const minTonsForStorage: Int = ton("0.02");
    const gasConsumption: Int = ton("0.02");

    const nftQueryGas: Int = ton("0.05");
    const nftTransferGas: Int = ton("0.12");
    const jettonTransferGas: Int = ton("0.07");

    owner: Address;

    brokerCollection: Address;
    jettonMaster: Address;
    treasury: Address;
    feeBps: Int as uint16; // e.g. 300 = 3%
    burnBps: Int as uint16; // portion of price to burn (<= feeBps)

    nextListingId: Int as uint64;
    listings: map<Int as uint64, Listing>;

    // pending listing keyed by nft item address (sender of OwnershipAssigned / ReportStaticData)
    pendingByNft: map<Address, PendingListing>;

    // buyer payments
    payments: map<Address, PaymentMap>;

    init(owner: Address, brokerCollection: Address, jettonMaster: Address, treasury: Address, feeBps: Int, burnBps: Int) {
        self.owner = owner;
        self.brokerCollection = brokerCollection;
        self.jettonMaster = jettonMaster;
        self.treasury = treasury;
        self.feeBps = feeBps;
        require(burnBps <= feeBps, "burnBps must be <= feeBps");
        self.burnBps = burnBps;
        self.nextListingId = 1;
    }

    receive() {
        cashback(sender());
    }

    // --- Listing creation (NFT inbound) ---

    // Called by BrokerNftItem when forward_amount > 0 during Transfer
    receive(msg: OwnershipAssigned) {
        // Store pending by the NFT item address (sender())
        let s = msg.forward_payload;
        // parse price from payload (coins)
        let price = s.loadCoins();
        require(price > 0, "Price must be > 0");

        self.pendingByNft.set(sender(), PendingListing{ seller: msg.prev_owner, price });

        // Ask NFT item for static data (index, collection) to validate sender and collection
        send(SendParameters{
            to: sender(),
            value: self.nftQueryGas,
            bounce: true,
            body: GetStaticData{ query_id: 0 }.toCell(),
        });
    }

    receive(msg: ReportStaticData) {
        // Validate that the sender is a real BrokerNftItem contract and belongs to our collection
        require(msg.collection == self.brokerCollection, "Unsupported collection");

        // Compute expected item address from (collection, index) using our BrokerNftItem init
        let expected = contractAddress(initOf BrokerNftItem(msg.collection, msg.index_id));
        require(expected == sender(), "Invalid NFT sender");

        let pending = self.pendingByNft.get(sender());
        require(pending != null, "No pending listing");

        let listingId = self.nextListingId;
        self.nextListingId += 1;

        self.listings.set(
            listingId,
            Listing{
                nftItem: sender(),
                seller: pending!!.seller,
                price: pending!!.price,
                active: true,
            }
        );
        self.pendingByNft.del(sender());

        cashback(sender());
    }

    // --- Jetton payment (buyer -> escrow wallet) ---

    receive(msg: TokenNotification) {
        // Validate notification comes from this contract's jetton wallet
        let walletAddr = contractAddress(initOf JettonDefaultWallet(self.jettonMaster, myAddress()));
        require(sender() == walletAddr, "Invalid jetton wallet sender");

        // forwardPayload should contain listingId as uint64
        let listingId = msg.forwardPayload.loadUint(64);

        let listing = self.listings.get(listingId);
        require(listing != null, "Listing not found");
        require(listing!!.active, "Listing inactive");

        let buyer = msg.from;

        let pMaybe = self.payments.get(buyer);
        let p = (pMaybe != null) ? pMaybe!! : PaymentMap{ unbox: emptyMap() };
        let unbox = p.unbox;

        let prev = unbox.get(listingId);
        let next = (prev != null ? prev!! : 0) + msg.amount;
        unbox.set(listingId, next);
        p.unbox = unbox;
        self.payments.set(buyer, p);

        cashback(sender());
    }

    // --- Finalize purchase (buyer triggers) ---

    receive(msg: FinalizePurchase) {
        let buyer = sender();
        let listing = self.listings.get(msg.listingId);
        require(listing != null, "Listing not found");
        require(listing!!.active, "Listing inactive");

        let p = self.payments.get(buyer);
        require(p != null, "No payment found");
        let paid = p!!.unbox.get(msg.listingId);
        require(paid != null, "No payment found");
        require(paid!! >= listing!!.price, "Insufficient payment");

        // Lock listing (best-effort)
        let locked = listing!!;
        locked.active = false;
        self.listings.set(msg.listingId, locked);

        // Transfer NFT to buyer
        send(SendParameters{
            to: listing!!.nftItem,
            value: self.nftTransferGas,
            bounce: true,
            body: Transfer{
                query_id: msg.listingId,
                new_owner: buyer,
                response_destination: buyer,
                custom_payload: null,
                forward_amount: 0,
                forward_payload: emptySlice(),
            }.toCell(),
        });

        // Pay seller from escrow jetton wallet
        // Fee/burn in bps:
        // - total fee = price * feeBps / 10000
        // - burn = price * burnBps / 10000
        // - treasuryFee = totalFee - burn
        let totalFee = (listing!!.price * self.feeBps) / 10000;
        let burn = (listing!!.price * self.burnBps) / 10000;
        require(burn <= totalFee, "burn exceeds total fee");
        let treasuryFee = totalFee - burn;
        let sellerAmount = listing!!.price - totalFee;

        let escrowJettonWallet = contractAddress(initOf JettonDefaultWallet(self.jettonMaster, myAddress()));

        let transfers: Int = 1;
        if (treasuryFee > 0) { transfers += 1; }
        if (burn > 0) { transfers += 1; }
        require(myBalance() >= transfers * self.jettonTransferGas, "Not enough TON for jetton ops");

        // seller payout
        send(SendParameters{
            to: escrowJettonWallet,
            value: self.jettonTransferGas,
            bounce: true,
            body: TokenTransfer{
                queryId: msg.listingId,
                amount: sellerAmount,
                destination: listing!!.seller,
                responseDestination: listing!!.seller,
                customPayload: null,
                forwardTonAmount: 0,
                forwardPayload: emptySlice(),
            }.toCell(),
        });

        // treasury fee
        if (treasuryFee > 0) {
            send(SendParameters{
                to: escrowJettonWallet,
                value: self.jettonTransferGas,
                bounce: true,
                body: TokenTransfer{
                    queryId: msg.listingId,
                    amount: treasuryFee,
                    destination: self.treasury,
                    responseDestination: self.treasury,
                    customPayload: null,
                    forwardTonAmount: 0,
                    forwardPayload: emptySlice(),
                }.toCell(),
            });
        }

        // burn (best-effort): request master to burn from escrow (SafeTokenBurn -> TokenBurnConfirmation to escrow wallet)
        if (burn > 0) {
            send(SendParameters{
                to: self.jettonMaster,
                value: self.jettonTransferGas,
                bounce: true,
                body: SafeTokenBurn{
                    queryId: msg.listingId,
                    amount: burn,
                    owner: myAddress(),
                    responseAddress: myAddress(),
                }.toCell(),
            });
        }
    }

    // Buyer refund path (for stuck payments)
    receive(msg: RefundPayment) {
        let buyer = sender();
        let listing = self.listings.get(msg.listingId);
        require(listing != null, "Listing not found");
        require(listing!!.active, "Listing inactive");

        let p = self.payments.get(buyer);
        require(p != null, "No payment found");
        let paid = p!!.unbox.get(msg.listingId);
        require(paid != null, "No payment found");
        require(paid!! > 0, "Nothing to refund");

        // Zero out payment first (best-effort safety against re-entrancy patterns)
        let pm = p!!;
        let unbox = pm.unbox;
        unbox.set(msg.listingId, 0);
        pm.unbox = unbox;
        self.payments.set(buyer, pm);

        // Refund jettons from escrow jetton wallet back to buyer
        let escrowJettonWallet = contractAddress(initOf JettonDefaultWallet(self.jettonMaster, myAddress()));
        require(myBalance() >= self.jettonTransferGas, "Not enough TON for jetton ops");
        send(SendParameters{
            to: escrowJettonWallet,
            value: self.jettonTransferGas,
            bounce: true,
            body: TokenTransfer{
                queryId: msg.listingId,
                amount: paid!!,
                destination: buyer,
                responseDestination: buyer,
                customPayload: null,
                forwardTonAmount: 0,
                forwardPayload: emptySlice(),
            }.toCell(),
        });
    }

    // Bounce handling: if NFT transfer to buyer fails, re-activate listing so buyer can retry or refund.
    bounced(msg: Slice) {
        // Parse bounced message header
        msg.skipBits(32); // 0xFFFFFFFF
        let op: Int = msg.loadUint(32);

        // Broker NFT Transfer op (TEP-62): 0x5fcc3d14
        if (op == 0x5fcc3d14) {
            let listingId: Int = msg.loadUint(64); // query_id
            let listing = self.listings.get(listingId);
            if (listing != null) {
                // If it was locked (inactive), re-open it so buyer can retry/refund.
                let reopened = listing!!;
                reopened.active = true;
                self.listings.set(listingId, reopened);
            }
        }
    }

    // --- Getters ---

    get fun getListing(listingId: Int): Listing? {
        return self.listings.get(listingId);
    }

    get fun getNextListingId(): Int {
        return self.nextListingId;
    }

    get fun getEscrowJettonWallet(): Address {
        return contractAddress(initOf JettonDefaultWallet(self.jettonMaster, myAddress()));
    }
}

