contract ArenaVault {
    staked: map<Address, Int>;

    receive("stake", amount: Int) {
        self.staked[msg.sender] += amount;
    }

    receive("claim") {
        let reward = self.staked[msg.sender] / 10;
        send(msg.sender, reward);
    }
}
