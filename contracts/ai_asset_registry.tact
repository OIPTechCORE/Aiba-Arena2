import "@stdlib/ownable";

message RegisterAsset {
    assetId: Int as uint64;
    owner: Address;
    metadata: Slice;
}

message TransferAsset {
    assetId: Int as uint64;
    newOwner: Address;
}

struct AssetRecord {
    owner: Address;
    metadata: Slice;
}

contract AiAssetRegistry with Ownable {
    owner: Address;
    assets: map<Int as uint64, AssetRecord>;

    init(owner: Address) {
        self.owner = owner;
        self.assets = emptyMap();
    }

    receive(msg: RegisterAsset) {
        require(sender() == self.owner || sender() == msg.owner, "Not authorized");
        require(self.assets.get(msg.assetId) == null, "Asset already exists");
        self.assets.set(msg.assetId, AssetRecord{ owner: msg.owner, metadata: msg.metadata });
        cashback(sender());
    }

    receive(msg: TransferAsset) {
        let record = self.assets.get(msg.assetId);
        require(record != null, "Asset not found");
        require(record!!.owner == sender(), "Not owner");
        record!!.owner = msg.newOwner;
        self.assets.set(msg.assetId, record!!);
        cashback(sender());
    }

    get fun getAsset(assetId: Int as uint64): AssetRecord? {
        return self.assets.get(assetId);
    }
}
