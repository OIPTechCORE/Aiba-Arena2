import "@stdlib/ownable";

message CreateListing {
    assetId: Int as uint64;
    price: Int as coins;
}

message BuyListing {
    listingId: Int as uint64;
}

struct Listing {
    assetId: Int as uint64;
    seller: Address;
    price: Int as coins;
    active: Bool;
}

contract AiAssetMarketplaceEscrow with Ownable {
    owner: Address;
    treasury: Address;
    feeBps: Int as uint16;   // total fee (treasury + burn)
    burnBps: Int as uint16;  // portion of fee to burn

    nextListingId: Int as uint64;
    listings: map<Int as uint64, Listing>;

    init(owner: Address, treasury: Address, feeBps: Int, burnBps: Int) {
        self.owner = owner;
        self.treasury = treasury;
        self.feeBps = feeBps;
        require(burnBps <= feeBps, "burnBps must be <= feeBps");
        self.burnBps = burnBps;
        self.nextListingId = 1;
        self.listings = emptyMap();
    }

    receive() {
        cashback(sender());
    }

    receive(msg: CreateListing) {
        require(msg.price > 0, "Price must be > 0");
        let id = self.nextListingId;
        self.nextListingId += 1;
        self.listings.set(id, Listing{
            assetId: msg.assetId,
            seller: sender(),
            price: msg.price,
            active: true
        });
        cashback(sender());
    }

    receive(msg: BuyListing) {
        let listing = self.listings.get(msg.listingId);
        require(listing != null, "Listing not found");
        require(listing!!.active, "Listing inactive");

        let paid = value();
        require(paid >= listing!!.price, "Insufficient payment");

        // lock listing
        listing!!.active = false;
        self.listings.set(msg.listingId, listing!!);

        // fee split (burn is implicit by not forwarding)
        let totalFee = (listing!!.price * self.feeBps) / 10000;
        let burn = (listing!!.price * self.burnBps) / 10000;
        let treasuryFee = totalFee - burn;
        let sellerAmount = listing!!.price - totalFee;

        if (treasuryFee > 0) {
            send(SendParameters{
                to: self.treasury,
                value: treasuryFee,
                bounce: false,
                body: emptyCell()
            });
        }

        if (sellerAmount > 0) {
            send(SendParameters{
                to: listing!!.seller,
                value: sellerAmount,
                bounce: false,
                body: emptyCell()
            });
        }

        cashback(sender());
    }

    get fun getListing(id: Int as uint64): Listing? {
        return self.listings.get(id);
    }
}
