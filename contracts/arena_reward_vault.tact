import "@stdlib/ownable";
import "./jetton_messages.tact";
import "./jetton_default_wallet.tact";

// Signed claim message (backend/oracle signs)
message(0x3b5d2b44) RewardClaim {
    to: Address;
    amount: Int as coins;
    seqno: Int as uint64;
    validUntil: Int as uint32;
    signature: Slice as bytes64;
}

message SetOracle {
    newKey: Int as uint256;
}

message SetJettonMaster {
    newMaster: Address;
}

contract ArenaRewardVault with Ownable {
    const jettonTransferGas: Int = ton("0.06");

    owner: Address;

    // Oracle pubkey used for signature verification (ed25519)
    oraclePublicKey: Int as uint256;

    // Jetton master (AIBA token contract address)
    jettonMaster: Address;

    // Replay protection (per-recipient monotonic counter)
    lastSeqno: map<Address, Int as uint64>;

    init(owner: Address, oraclePublicKey: Int as uint256, jettonMaster: Address) {
        self.owner = owner;
        self.oraclePublicKey = oraclePublicKey;
        self.jettonMaster = jettonMaster;
    }

    // Empty receiver for deployment/topups
    receive() {
        cashback(sender());
    }

    // Admin can rotate oracle key
    receive(msg: SetOracle) {
        self.requireOwner();
        self.oraclePublicKey = msg.newKey;
        cashback(sender());
    }

    // Admin can change jetton master (migration)
    receive(msg: SetJettonMaster) {
        self.requireOwner();
        self.jettonMaster = msg.newMaster;
        cashback(sender());
    }

    // Main claim path: verify signature + replay protection, then transfer jettons from vault wallet.
    receive(msg: RewardClaim) {
        require(now() <= msg.validUntil, "Claim expired");
        require(msg.amount > 0, "Amount must be > 0");
        // Prevent third-party front-running that would consume seqno and make the real user fail.
        // The transaction must be sent from the same wallet that will receive rewards.
        require(sender() == msg.to, "Sender must equal recipient");

        // Verify replay protection for this `to`
        let prev = self.lastSeqno.get(msg.to);
        let expected = (prev != null ? prev!! : 0) + 1;
        require(msg.seqno == expected, "Invalid seqno");

        // Verify signature over canonical payload (prevents front-running)
        let payloadHash = beginCell()
            .storeAddress(myAddress())
            .storeAddress(self.jettonMaster)
            .storeAddress(msg.to)
            .storeCoins(msg.amount)
            .storeUint(msg.seqno, 64)
            .storeUint(msg.validUntil, 32)
            .endCell()
            .hash();

        require(checkSignature(payloadHash, msg.signature, self.oraclePublicKey), "Invalid signature");

        // Mark seqno as used for this recipient
        self.lastSeqno.set(msg.to, msg.seqno);

        // Transfer jettons from the vault's Jetton wallet to msg.to
        let vaultWalletInit: StateInit = initOf JettonDefaultWallet(self.jettonMaster, myAddress());
        let vaultJettonWallet: Address = contractAddress(vaultWalletInit);

        // We must attach enough TON for the Jetton wallet to process transfer.
        require(myBalance() >= self.jettonTransferGas, "Vault needs TON for gas");

        send(SendParameters{
            to: vaultJettonWallet,
            value: self.jettonTransferGas,
            bounce: true,
            body: TokenTransfer{
                queryId: msg.seqno,
                amount: msg.amount,
                destination: msg.to,
                responseDestination: msg.to,
                customPayload: null,
                forwardTonAmount: 0,
                forwardPayload: emptySlice(),
            }.toCell(),
        });
    }

    // Optional: accept notifications when vault receives Jettons (if sender attached forwardTonAmount)
    receive(msg: TokenNotification) {
        // Validate that notification comes from vault's own Jetton wallet
        let vaultWalletInit: StateInit = initOf JettonDefaultWallet(self.jettonMaster, myAddress());
        let expected: Address = contractAddress(vaultWalletInit);
        require(sender() == expected, "Invalid jetton wallet sender");
        // no-op: balance is tracked in wallet, not here
        cashback(sender());
    }

    get fun getOraclePublicKey(): Int {
        return self.oraclePublicKey;
    }

    get fun getJettonMaster(): Address {
        return self.jettonMaster;
    }

    get fun getVaultJettonWallet(): Address {
        let vaultWalletInit: StateInit = initOf JettonDefaultWallet(self.jettonMaster, myAddress());
        return contractAddress(vaultWalletInit);
    }

    get fun getLastSeqno(to: Address): Int {
        let v = self.lastSeqno.get(to);
        return v != null ? v!! : 0;
    }
}

