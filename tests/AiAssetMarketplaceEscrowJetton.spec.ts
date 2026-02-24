import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import '@ton/test-utils';

import { AiAssetMarketplaceEscrowJetton } from '../build/AiAssetMarketplaceEscrowJetton/AiAssetMarketplaceEscrowJetton_AiAssetMarketplaceEscrowJetton';

describe('AiAssetMarketplaceEscrowJetton', () => {
    let blockchain: Blockchain;
    let owner: SandboxContract<TreasuryContract>;
    let seller: SandboxContract<TreasuryContract>;
    let treasury: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        owner = await blockchain.treasury('owner');
        seller = await blockchain.treasury('seller');
        treasury = await blockchain.treasury('treasury');
    });

    it('creates a listing', async () => {
        const escrow = blockchain.openContract(
            await AiAssetMarketplaceEscrowJetton.fromInit(
                owner.address,
                owner.address,
                owner.address,
                treasury.address,
                300n,
                0n,
            ),
        );
        await escrow.send(owner.getSender(), { value: toNano('0.2') }, null);

        await escrow.send(
            seller.getSender(),
            { value: toNano('0.2') },
            { $$type: 'CreateListing', assetId: 11n, price: toNano('1') },
        );

        const listing = await escrow.getGetListing(1n);
        expect(listing?.active).toBe(true);
        expect(listing?.assetId).toBe(11n);
    });
});
