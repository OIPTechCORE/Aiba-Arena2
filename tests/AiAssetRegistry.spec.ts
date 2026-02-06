import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { beginCell, toNano } from '@ton/core';
import '@ton/test-utils';

import { AiAssetRegistry } from '../build/AiAssetRegistry/AiAssetRegistry_AiAssetRegistry';

describe('AiAssetRegistry', () => {
    let blockchain: Blockchain;
    let owner: SandboxContract<TreasuryContract>;
    let user: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        owner = await blockchain.treasury('owner');
        user = await blockchain.treasury('user');
    });

    it('registers and transfers an asset', async () => {
        const registry = blockchain.openContract(await AiAssetRegistry.fromInit(owner.address));
        await registry.send(owner.getSender(), { value: toNano('0.2') }, null);

        const meta = beginCell().storeStringTail('asset-meta').endCell().beginParse();
        await registry.send(
            owner.getSender(),
            { value: toNano('0.2') },
            { $$type: 'RegisterAsset', assetId: 1n, owner: user.address, metadata: meta },
        );

        const asset = await registry.getGetAsset(1n);
        expect(asset?.owner.toString()).toBe(user.address.toString());

        await registry.send(
            user.getSender(),
            { value: toNano('0.2') },
            { $$type: 'TransferAsset', assetId: 1n, newOwner: owner.address },
        );

        const updated = await registry.getGetAsset(1n);
        expect(updated?.owner.toString()).toBe(owner.address.toString());
    });
});
