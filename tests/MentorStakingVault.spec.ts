import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import '@ton/test-utils';

import { MentorStakingVault } from '../build/MentorStakingVault/MentorStakingVault_MentorStakingVault';

describe('MentorStakingVault', () => {
    let blockchain: Blockchain;
    let owner: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        owner = await blockchain.treasury('owner');
    });

    it('deploys and returns empty stake', async () => {
        const vault = blockchain.openContract(await MentorStakingVault.fromInit(owner.address, owner.address, 1500n));
        await vault.send(owner.getSender(), { value: toNano('0.2') }, null);
        const stake = await vault.getGetStake(owner.address);
        expect(stake).toBeNull();
    });
});
