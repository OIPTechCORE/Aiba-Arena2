contract AibaJetton {
    totalSupply: Int as uint128;

    init() {
        self.totalSupply = 1000000000;
    }

    receive("mint", amount: Int) {
        self.totalSupply += amount;
    }

    get fun supply(): Int {
        return self.totalSupply;
    }
}
