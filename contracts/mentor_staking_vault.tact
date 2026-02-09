import "@stdlib/ownable";
import "./jetton_messages.tact";
import "./jetton_default_wallet.tact";

message WithdrawStake {
    amount: Int as coins;
}

struct StakeInfo {
    amount: Int as coins;
    startedAt: Int as uint32;
}

contract MentorStakingVault with Ownable {
    owner: Address;
    jettonMaster: Address;
    apyBps: Int as uint16; // e.g. 1500 = 15%

    stakes: map<Address, StakeInfo>;

    init(owner: Address, jettonMaster: Address, apyBps: Int) {
        self.owner = owner;
        self.jettonMaster = jettonMaster;
        self.apyBps = apyBps;
        self.stakes = emptyMap();
    }

    receive() {
        cashback(sender());
    }

    // User stakes by sending jettons to this contract's wallet (TokenNotification)
    receive(msg: TokenNotification) {
        let walletAddr = contractAddress(initOf JettonDefaultWallet(self.jettonMaster, myAddress()));
        require(sender() == walletAddr, "Invalid jetton wallet sender");

        let st = self.stakes.get(msg.from);
        if (st == null) {
            self.stakes.set(msg.from, StakeInfo{ amount: msg.amount, startedAt: now() });
        } else {
            let updated = st!!;
            updated.amount += msg.amount;
            self.stakes.set(msg.from, updated);
        }
        cashback(sender());
    }

    receive(msg: WithdrawStake) {
        let st = self.stakes.get(sender());
        require(st != null, "No stake");
        require(msg.amount > 0 && msg.amount <= st!!.amount, "Invalid amount");

        // simple linear reward by time held
        let elapsed = now() - st!!.startedAt; // seconds
        let reward = (msg.amount * self.apyBps * elapsed) / (10000 * 365 * 24 * 3600);

        let remaining = st!!.amount - msg.amount;
        if (remaining == 0) {
            self.stakes.del(sender());
        } else {
            self.stakes.set(sender(), StakeInfo{ amount: remaining, startedAt: st!!.startedAt });
        }

        let walletAddr = contractAddress(initOf JettonDefaultWallet(self.jettonMaster, myAddress()));
        send(SendParameters{
            to: walletAddr,
            value: ton("0.03"),
            bounce: true,
            body: TokenTransfer{
                queryId: 0,
                amount: msg.amount + reward,
                destination: sender(),
                responseDestination: sender(),
                customPayload: null,
                forwardTonAmount: 0,
                forwardPayload: emptySlice()
            }.toCell(),
        });

        cashback(sender());
    }

    get fun getStake(user: Address): StakeInfo? {
        return self.stakes.get(user);
    }
}
