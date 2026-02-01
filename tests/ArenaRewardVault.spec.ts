import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { beginCell, toNano } from '@ton/core';
import '@ton/test-utils';
import nacl from 'tweetnacl';

import { AibaToken } from '../build/AibaToken/AibaToken_AibaToken';
import { JettonDefaultWallet } from '../build/AibaToken/AibaToken_JettonDefaultWallet';
import { ArenaRewardVault } from '../build/ArenaRewardVault/ArenaRewardVault_ArenaRewardVault';

function toPubKeyUint256(pub: Uint8Array) {
    return BigInt('0x' + Buffer.from(pub).toString('hex'));
}

function buildClaimPayload({
    vaultAddress,
    jettonMaster,
    to,
    amount,
    seqno,
    validUntil,
}: {
    vaultAddress: any;
    jettonMaster: any;
    to: any;
    amount: bigint;
    seqno: bigint;
    validUntil: bigint;
}) {
    return beginCell()
        .storeAddress(vaultAddress)
        .storeAddress(jettonMaster)
        .storeAddress(to)
        .storeCoins(amount)
        .storeUint(seqno, 64)
        .storeUint(validUntil, 32)
        .endCell();
}

describe('ArenaRewardVault (claims)', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let user: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        user = await blockchain.treasury('user');
    });

    it('accepts a valid claim only from recipient', async () => {
        // Deploy token
        const token = blockchain.openContract(await AibaToken.fromInit(deployer.address, null));
        await token.send(deployer.getSender(), { value: toNano('0.2') }, { $$type: 'Deploy', queryId: 0n });

        // Oracle keypair
        const seed = new Uint8Array(32);
        seed[0] = 7;
        seed[1] = 9;
        const kp = nacl.sign.keyPair.fromSeed(seed);
        const oraclePub = toPubKeyUint256(kp.publicKey);

        // Deploy vault
        const vault = blockchain.openContract(
            await ArenaRewardVault.fromInit(deployer.address, oraclePub, token.address),
        );
        await vault.send(deployer.getSender(), { value: toNano('0.4') }, null);

        // Mint inventory to vault
        const amount = 123n;
        await token.send(deployer.getSender(), { value: toNano('0.1') }, { $$type: 'Mint', to: vault.address, amount });

        const validUntil = BigInt(Math.floor(Date.now() / 1000) + 600);
        const seqno = 1n;

        const payload = buildClaimPayload({
            vaultAddress: vault.address,
            jettonMaster: token.address,
            to: user.address,
            amount,
            seqno,
            validUntil,
        });
        const sig = nacl.sign.detached(new Uint8Array(payload.hash()), kp.secretKey);
        const signature = Buffer.from(sig); // 64 bytes

        // Wrong sender should fail (front-running protection)
        const bad = await vault.send(
            deployer.getSender(),
            { value: toNano('0.15') },
            { $$type: 'RewardClaim', to: user.address, amount, seqno, validUntil, signature },
        );
        expect(bad.transactions).toHaveTransaction({ to: vault.address, success: false });

        // Correct sender succeeds
        const ok = await vault.send(
            user.getSender(),
            { value: toNano('0.15') },
            { $$type: 'RewardClaim', to: user.address, amount, seqno, validUntil, signature },
        );
        expect(ok.transactions).toHaveTransaction({ to: vault.address, success: true });

        // User received jettons
        const userWalletAddress = await token.getGetWalletAddress(user.address);
        const userWallet = blockchain.openContract(JettonDefaultWallet.fromAddress(userWalletAddress));
        const userWalletData = await userWallet.getGetWalletData();
        expect(userWalletData.balance).toBe(amount);
    });
});
