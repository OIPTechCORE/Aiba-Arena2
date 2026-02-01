message Mint {
    amount: Int as uint128;
}

// NOTE: This is a simple example contract (not a full Jetton implementation).
contract AibaJettonSupply {
    totalSupply: Int as uint128;

    receive() {
        cashback(sender());
    }

    init() {
        self.totalSupply = 1000000000;
    }

    receive(msg: Mint) {
        self.totalSupply += msg.amount;
        cashback(sender());
    }

    get fun supply(): Int {
        return self.totalSupply;
    }
}
