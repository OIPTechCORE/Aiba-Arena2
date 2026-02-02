import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { beginCell, toNano } from '@ton/core';
import '@ton/test-utils';

import { AibaToken } from '../build/AibaToken/AibaToken_AibaToken';
import { JettonDefaultWallet } from '../build/AibaToken/AibaToken_JettonDefaultWallet';
import { BrokerNftCollection } from '../build/BrokerNFT/BrokerNFT_BrokerNftCollection';
import { BrokerNftItem } from '../build/BrokerNFT/BrokerNFT_BrokerNftItem';
import { BrokerMarketplaceEscrow } from '../build/BrokerMarketplaceEscrow/BrokerMarketplaceEscrow_BrokerMarketplaceEscrow';

describe('BrokerMarketplaceEscrow (purchase flow)', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let seller: SandboxContract<TreasuryContract>;
    let buyer: SandboxContract<TreasuryContract>;
    let treasury: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        seller = await blockchain.treasury('seller');
        buyer = await blockchain.treasury('buyer');
        treasury = await blockchain.treasury('treasury');
    });

    it('buyer pays jettons, finalizes, seller gets paid and fee burns', async () => {
        // Deploy AIBA token
        const token = blockchain.openContract(await AibaToken.fromInit(deployer.address, null));
        await token.send(deployer.getSender(), { value: toNano('0.2') }, { $$type: 'Deploy', queryId: 0n });

        // Mint jettons to buyer
        const price = 1000n;
        await token.send(
            deployer.getSender(),
            { value: toNano('0.1') },
            { $$type: 'Mint', to: buyer.address, amount: price },
        );

        // Deploy broker NFT collection
        const royalty = {
            $$type: 'RoyaltyParams' as const,
            numerator: 0n,
            denominator: 1n,
            destination: deployer.address,
        };
        const collectionContent = beginCell().endCell();
        const collection = blockchain.openContract(
            await BrokerNftCollection.fromInit(deployer.address, collectionContent, royalty),
        );
        await collection.send(deployer.getSender(), { value: toNano('0.3') }, null);

        // Deploy escrow marketplace with 3% fee, 1% burn (burn uses SafeTokenBurn on master)
        const feeBps = 300n;
        const burnBps = 100n;
        const escrow = blockchain.openContract(
            await BrokerMarketplaceEscrow.fromInit(
                deployer.address,
                collection.address,
                token.address,
                treasury.address,
                feeBps,
                burnBps,
            ),
        );
        await escrow.send(deployer.getSender(), { value: toNano('0.3') }, null);

        // Mint broker NFT #0 to seller
        const metadata = beginCell().endCell();
        await collection.send(
            deployer.getSender(),
            { value: toNano('0.4') },
            { $$type: 'MintBroker', to: seller.address, metadata },
        );
        const item = blockchain.openContract(await BrokerNftItem.fromInit(collection.address, 0n));

        // Seller transfers NFT to escrow with forward payload containing price
        const forwardPayload = beginCell().storeCoins(price).endCell().beginParse();
        await item.send(
            seller.getSender(),
            { value: toNano('0.4') },
            {
                $$type: 'Transfer',
                query_id: 1n,
                new_owner: escrow.address,
                response_destination: seller.address,
                custom_payload: null,
                forward_amount: toNano('0.1'),
                forward_payload: forwardPayload,
            },
        );

        const listing = await escrow.getGetListing(1n);
        expect(listing?.active).toBe(true);
        expect(listing?.price).toBe(price);

        // Buyer pays jettons to escrow (send TokenTransfer to buyer wallet, destination = escrow)
        const buyerWalletAddress = await token.getGetWalletAddress(buyer.address);
        const buyerWallet = blockchain.openContract(JettonDefaultWallet.fromAddress(buyerWalletAddress));
        const listingIdPayload = beginCell().storeUint(1n, 64).endCell().beginParse();
        await buyerWallet.send(
            buyer.getSender(),
            { value: toNano('0.25') },
            {
                $$type: 'TokenTransfer',
                queryId: 1n,
                amount: price,
                destination: escrow.address,
                responseDestination: buyer.address,
                customPayload: null,
                // Must be > 0 so the recipient wallet sends TokenNotification to escrow (the wallet owner).
                forwardTonAmount: toNano('0.05'),
                forwardPayload: listingIdPayload,
            },
        );

        // Buyer finalizes
        await escrow.send(buyer.getSender(), { value: toNano('0.35') }, { $$type: 'FinalizePurchase', listingId: 1n });

        // NFT owner is buyer
        const data = await item.getGetNftData();
        expect(data.owner_address.equals(buyer.address)).toBe(true);

        // Seller received payout: price - (price*feeBps/10000)
        const totalFee = (price * feeBps) / 10000n;
        const sellerAmount = price - totalFee;
        const sellerWalletAddress = await token.getGetWalletAddress(seller.address);
        const sellerWallet = blockchain.openContract(JettonDefaultWallet.fromAddress(sellerWalletAddress));
        const sellerWalletData = await sellerWallet.getGetWalletData();
        expect(sellerWalletData.balance).toBe(sellerAmount);

        // Treasury got (totalFee - burn)
        const burn = (price * burnBps) / 10000n;
        const treasuryFee = totalFee - burn;
        const treasuryWalletAddress = await token.getGetWalletAddress(treasury.address);
        const treasuryWallet = blockchain.openContract(JettonDefaultWallet.fromAddress(treasuryWalletAddress));
        const treasuryWalletData = await treasuryWallet.getGetWalletData();
        expect(treasuryWalletData.balance).toBe(treasuryFee);

        // Total supply reduced by burn
        const supply = await token.getGetTotalSupply();
        expect(supply).toBe(price - burn);
    });

    it('buyer can refund payment if listing is active', async () => {
        // Deploy AIBA token
        const token = blockchain.openContract(await AibaToken.fromInit(deployer.address, null));
        await token.send(deployer.getSender(), { value: toNano('0.2') }, { $$type: 'Deploy', queryId: 0n });

        // Mint jettons to buyer
        const price = 1000n;
        await token.send(
            deployer.getSender(),
            { value: toNano('0.1') },
            { $$type: 'Mint', to: buyer.address, amount: price },
        );

        // Deploy broker NFT collection
        const royalty = {
            $$type: 'RoyaltyParams' as const,
            numerator: 0n,
            denominator: 1n,
            destination: deployer.address,
        };
        const collectionContent = beginCell().endCell();
        const collection = blockchain.openContract(
            await BrokerNftCollection.fromInit(deployer.address, collectionContent, royalty),
        );
        await collection.send(deployer.getSender(), { value: toNano('0.3') }, null);

        // Deploy escrow marketplace (no burn needed for refund test)
        const escrow = blockchain.openContract(
            await BrokerMarketplaceEscrow.fromInit(
                deployer.address,
                collection.address,
                token.address,
                treasury.address,
                300n,
                0n,
            ),
        );
        await escrow.send(deployer.getSender(), { value: toNano('0.3') }, null);

        // Mint broker NFT #0 to seller and list it
        const metadata = beginCell().endCell();
        await collection.send(
            deployer.getSender(),
            { value: toNano('0.4') },
            { $$type: 'MintBroker', to: seller.address, metadata },
        );
        const item = blockchain.openContract(await BrokerNftItem.fromInit(collection.address, 0n));

        const forwardPayload = beginCell().storeCoins(price).endCell().beginParse();
        await item.send(
            seller.getSender(),
            { value: toNano('0.4') },
            {
                $$type: 'Transfer',
                query_id: 1n,
                new_owner: escrow.address,
                response_destination: seller.address,
                custom_payload: null,
                forward_amount: toNano('0.1'),
                forward_payload: forwardPayload,
            },
        );

        const listing = await escrow.getGetListing(1n);
        expect(listing?.active).toBe(true);
        expect(listing?.price).toBe(price);

        // Buyer pays jettons to escrow (token notification stores payment)
        const buyerWalletAddress = await token.getGetWalletAddress(buyer.address);
        const buyerWallet = blockchain.openContract(JettonDefaultWallet.fromAddress(buyerWalletAddress));
        const listingIdPayload = beginCell().storeUint(1n, 64).endCell().beginParse();
        await buyerWallet.send(
            buyer.getSender(),
            { value: toNano('0.25') },
            {
                $$type: 'TokenTransfer',
                queryId: 1n,
                amount: price,
                destination: escrow.address,
                responseDestination: buyer.address,
                customPayload: null,
                forwardTonAmount: toNano('0.05'),
                forwardPayload: listingIdPayload,
            },
        );

        // Buyer wallet is now empty
        const buyerWalletData0 = await buyerWallet.getGetWalletData();
        expect(buyerWalletData0.balance).toBe(0n);

        // Buyer refunds
        await escrow.send(buyer.getSender(), { value: toNano('0.25') }, { $$type: 'RefundPayment', listingId: 1n });

        // Buyer got jettons back
        const buyerWalletData1 = await buyerWallet.getGetWalletData();
        expect(buyerWalletData1.balance).toBe(price);

        // Escrow jetton wallet is empty again
        const escrowWalletAddress = await escrow.getGetEscrowJettonWallet();
        const escrowWallet = blockchain.openContract(JettonDefaultWallet.fromAddress(escrowWalletAddress));
        const escrowWalletData = await escrowWallet.getGetWalletData();
        expect(escrowWalletData.balance).toBe(0n);
    });
});
