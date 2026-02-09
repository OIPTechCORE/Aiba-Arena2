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
message SetOperator {
    operator: Address;
    active: Bool;
}

struct AssetRecord {
    owner: Address;
    metadata: Slice;
}

contract AiAssetRegistry with Ownable {
    owner: Address;
    assets: map<Int as uint64, AssetRecord>;
    operators: map<Address, Bool>;

    init(owner: Address) {
        self.owner = owner;
        self.assets = emptyMap();
        self.operators = emptyMap();
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
        let op = self.operators.get(sender());
        require(record!!.owner == sender() || (op != null && op!!), "Not owner");
        record!!.owner = msg.newOwner;
        self.assets.set(msg.assetId, record!!);
        cashback(sender());
    }

    receive(msg: SetOperator) {
        require(sender() == self.owner, "Only owner");
        if (msg.active) {
            self.operators.set(msg.operator, true);
        } else {
            self.operators.del(msg.operator);
        }
        cashback(sender());
    }

    get fun getAsset(assetId: Int as uint64): AssetRecord? {
        return self.assets.get(assetId);
    }
}
