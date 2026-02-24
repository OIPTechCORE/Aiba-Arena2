import "@stdlib/ownable";
import "./jetton_messages.tact";
import "./jetton_default_wallet.tact";
import "./ai_asset_registry.tact";

message FinalizePurchase {
    listingId: Int as uint64;
}
message CreateListing {
    assetId: Int as uint64;
    price: Int as coins;
}

struct Listing {
    assetId: Int as uint64;
    seller: Address;
    price: Int as coins;
    active: Bool;
}

// Nested map helper (buyer -> (listingId -> amountPaid))
struct PaymentMap {
    unbox: map<Int as uint64, Int as coins>;
}

contract AiAssetMarketplaceEscrowJetton with Ownable {
    owner: Address;
    registry: Address;
    jettonMaster: Address;
    treasury: Address;
    feeBps: Int as uint16; // total fee (treasury + burn)
    burnBps: Int as uint16; // portion of fee to burn

    nextListingId: Int as uint64;
    listings: map<Int as uint64, Listing>;
    payments: map<Address, PaymentMap>;

    init(owner: Address, registry: Address, jettonMaster: Address, treasury: Address, feeBps: Int, burnBps: Int) {
        self.owner = owner;
        self.registry = registry;
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

    // Seller creates a listing off-chain; this message stores on-chain listing
    receive(msg: CreateListing) {
        require(msg.price > 0, "Price must be > 0");
        let id = self.nextListingId;
        self.nextListingId += 1;
        self.listings.set(id, Listing{ assetId: msg.assetId, seller: sender(), price: msg.price, active: true });
        cashback(sender());
    }

    // Buyer pays AIBA jettons to escrow wallet; forwardPayload must contain listingId
    receive(msg: TokenNotification) {
        let walletAddr = contractAddress(initOf JettonDefaultWallet(self.jettonMaster, myAddress()));
        require(sender() == walletAddr, "Invalid jetton wallet sender");
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

    // Buyer finalizes purchase; escrow transfers asset in registry and pays seller
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

        // Lock listing
        let locked = listing!!;
        locked.active = false;
        self.listings.set(msg.listingId, locked);

        // Transfer asset in registry (escrow must be operator)
        send(SendParameters{
            to: self.registry,
            value: ton("0.02"),
            bounce: true,
            body: TransferAsset{ assetId: listing!!.assetId, newOwner: buyer }.toCell(),
        });

        // Pay seller from escrow jetton wallet
        let totalFee = (listing!!.price * self.feeBps) / 10000;
        let burn = (listing!!.price * self.burnBps) / 10000;
        let treasuryFee = totalFee - burn;
        let sellerAmount = listing!!.price - totalFee;

        let walletAddr = contractAddress(initOf JettonDefaultWallet(self.jettonMaster, myAddress()));

        if (treasuryFee > 0) {
            send(SendParameters{
                to: walletAddr,
                value: ton("0.03"),
                bounce: true,
                body: TokenTransfer{
                    queryId: 0,
                    amount: treasuryFee,
                    destination: self.treasury,
                    responseDestination: self.treasury,
                    customPayload: null,
                    forwardTonAmount: 0,
                    forwardPayload: emptySlice()
                }.toCell(),
            });
        }

        if (sellerAmount > 0) {
            send(SendParameters{
                to: walletAddr,
                value: ton("0.03"),
                bounce: true,
                body: TokenTransfer{
                    queryId: 0,
                    amount: sellerAmount,
                    destination: listing!!.seller,
                    responseDestination: listing!!.seller,
                    customPayload: null,
                    forwardTonAmount: 0,
                    forwardPayload: emptySlice()
                }.toCell(),
            });
        }

        cashback(sender());
    }

    get fun getListing(id: Int): Listing? {
        return self.listings.get(id);
    }
}
