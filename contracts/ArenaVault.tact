message Stake {
    amount: Int as uint128;
}

message Claim {}

// NOTE: This is a minimal example vault.
// It tracks "staked" amounts internally. The optional payout in `Claim`
// attempts to send reward as nanoTON (may fail at runtime if balance is low),
// but it compiles and demonstrates message handling + maps.
contract ArenaVault {
    staked: map<Address, Int as uint128>;

    receive() {
        cashback(sender());
    }

    receive(msg: Stake) {
        let who = sender();
        let prev = self.staked.get(who);
        let next = (prev != null ? prev!! : 0) + msg.amount;
        self.staked.set(who, next);
        cashback(sender());
    }

    receive(_: Claim) {
        let who = sender();
        let prev = self.staked.get(who);
        if (prev == null) {
            cashback(sender());
            return;
        }

        let stake = prev!!;
        let reward = stake / 10;

        // Reset stake (example behavior)
        self.staked.set(who, 0);

        // Optional: try paying reward as nanoTON (ignore failures)
        send(SendParameters{
            to: who,
            value: reward,
            mode: SendIgnoreErrors,
        });
    }

    get fun stakedOf(addr: Address): Int {
        let v = self.staked.get(addr);
        return v != null ? v!! : 0;
    }
}
