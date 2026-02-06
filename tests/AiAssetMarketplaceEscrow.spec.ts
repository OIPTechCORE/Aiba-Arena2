import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import '@ton/test-utils';

import { AiAssetMarketplaceEscrow } from '../build/AiAssetMarketplaceEscrow/AiAssetMarketplaceEscrow_AiAssetMarketplaceEscrow';

describe('AiAssetMarketplaceEscrow', () => {
    let blockchain: Blockchain;
    let owner: SandboxContract<TreasuryContract>;
    let seller: SandboxContract<TreasuryContract>;
    let buyer: SandboxContract<TreasuryContract>;
    let treasury: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        owner = await blockchain.treasury('owner');
        seller = await blockchain.treasury('seller');
        buyer = await blockchain.treasury('buyer');
        treasury = await blockchain.treasury('treasury');
    });

    it('creates and buys a listing (TON payment split)', async () => {
        const escrow = blockchain.openContract(
            await AiAssetMarketplaceEscrow.fromInit(owner.address, treasury.address, 300n, 50n),
        );
        await escrow.send(owner.getSender(), { value: toNano('0.2') }, null);

        await escrow.send(
            seller.getSender(),
            { value: toNano('0.2') },
            { $$type: 'CreateListing', assetId: 7n, price: toNano('1') },
        );

        const listing = await escrow.getGetListing(1n);
        expect(listing?.active).toBe(true);

        await escrow.send(buyer.getSender(), { value: toNano('1') }, { $$type: 'BuyListing', listingId: 1n });
        const after = await escrow.getGetListing(1n);
        expect(after?.active).toBe(false);
    });
});
