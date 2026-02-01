import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { beginCell, toNano } from '@ton/core';
import '@ton/test-utils';

import { AibaToken } from '../build/AibaToken/AibaToken_AibaToken';
import { BrokerNftCollection } from '../build/BrokerNFT/BrokerNftCollection_BrokerNftCollection';
import { BrokerNftItem } from '../build/BrokerNFT/BrokerNftItem_BrokerNftItem';
import { BrokerMarketplaceEscrow } from '../build/BrokerMarketplaceEscrow/BrokerMarketplaceEscrow_BrokerMarketplaceEscrow';

describe('BrokerMarketplaceEscrow (happy path)', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let seller: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        seller = await blockchain.treasury('seller');
    });

    it('lists a broker NFT (escrow receives and validates item)', async () => {
        // Deploy AIBA token
        const token = blockchain.openContract(await AibaToken.fromInit(deployer.address, null));
        await token.send(
            deployer.getSender(),
            { value: toNano('0.2') },
            null
        );

        // Deploy broker NFT collection
        const royalty = {
            numerator: 0n,
            denominator: 1n,
            destination: deployer.address,
        };
        const collectionContent = beginCell().endCell();
        const collection = blockchain.openContract(
            await BrokerNftCollection.fromInit(deployer.address, collectionContent, royalty)
        );
        await collection.send(deployer.getSender(), { value: toNano('0.3') }, null);

        // Deploy escrow marketplace
        const escrow = blockchain.openContract(
            await BrokerMarketplaceEscrow.fromInit(
                deployer.address,
                collection.address,
                token.address,
                deployer.address,
                300n
            )
        );
        await escrow.send(deployer.getSender(), { value: toNano('0.3') }, null);

        // Mint broker NFT #0 to seller
        const metadata = beginCell().endCell();
        await collection.send(
            deployer.getSender(),
            { value: toNano('0.4') },
            { $$type: 'MintBroker', to: seller.address, metadata }
        );

        const item = blockchain.openContract(await BrokerNftItem.fromInit(collection.address, 0n));

        // Seller transfers NFT to escrow with forward payload containing price
        const price = 100n;
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
                forward_amount: 1n, // triggers OwnershipAssigned to escrow
                forward_payload: forwardPayload,
            }
        );

        // Listing should exist and be active
        const listing = await escrow.getListing(1n);
        expect(listing?.active).toBe(true);
        expect(listing?.price).toBe(price);
    });
});

