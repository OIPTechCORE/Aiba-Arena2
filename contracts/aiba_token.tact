import "@stdlib/deploy";
import "@stdlib/ownable";
import "./jetton_messages.tact";
import "./jetton_default_wallet.tact";

message Mint {
    to: Address;
    amount: Int as coins;
}

// Off-chain metadata is usually stored via a content Cell (TEP-64).
// For an MVP, keep content as a Cell? and expose via a getter.
contract AibaToken with Deployable, Ownable {
    totalSupply: Int as coins;
    owner: Address;
    mintable: Bool;
    content: Cell?;

    init(owner: Address, content: Cell?) {
        self.totalSupply = 0;
        self.owner = owner;
        self.mintable = true;
        self.content = content;
    }

    receive(msg: Mint) {
        self.requireOwner();
        require(self.mintable, "Minting disabled");
        self.mint(msg.to, msg.amount, msg.to);
    }

    receive(msg: SafeTokenBurn) {
        let ctx: Context = context();
        require(ctx.sender == msg.owner, "Only owner can burn tokens");
        require(self.totalSupply - msg.amount >= 0, "Invalid total supply after burn");
        self.burn(msg.amount, msg.owner, msg.queryId);
    }

    // ===== Internal helpers =====

    fun mint(to: Address, amount: Int, responseAddress: Address?) {
        self.totalSupply = self.totalSupply + amount;

        let winit: StateInit = self.getJettonWalletInit(to);
        let walletAddress: Address = contractAddress(winit);
        send(SendParameters{
            to: walletAddress,
            value: 0,
            bounce: false,
            mode: SendRemainingValue,
            body: TokenTransferInternal{
                amount: amount,
                queryId: 0,
                from: myAddress(),
                responseAddress: responseAddress,
                forwardTonAmount: 0,
                forwardPayload: emptySlice(),
            }.toCell(),
            code: winit.code,
            data: winit.data,
        });
    }

    fun burn(burnAmount: Int, to: Address, queryId: Int) {
        self.totalSupply = self.totalSupply - burnAmount;

        let winit: StateInit = self.getJettonWalletInit(to);
        let walletAddress: Address = contractAddress(winit);
        send(SendParameters{
            to: walletAddress,
            value: 0,
            bounce: false,
            mode: SendRemainingValue,
            body: TokenBurnConfirmation{
                queryId: queryId,
                amount: burnAmount,
            }.toCell(),
            code: winit.code,
            data: winit.data,
        });
    }

    // ===== Getters =====

    get fun getWalletAddress(owner: Address): Address {
        let winit: StateInit = self.getJettonWalletInit(owner);
        return contractAddress(winit);
    }

    get fun getJettonWalletInit(address: Address): StateInit {
        return initOf JettonDefaultWallet(myAddress(), address);
    }

    get fun getTotalSupply(): Int {
        return self.totalSupply;
    }

    get fun getContent(): Cell? {
        return self.content;
    }
}

