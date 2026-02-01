import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { AibaJetton } from '../build/AibaJetton/AibaJetton_AibaJetton';
import '@ton/test-utils';

describe('AibaJetton', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let aibaJetton: SandboxContract<AibaJetton>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        aibaJetton = blockchain.openContract(await AibaJetton.fromInit(0n, 0n));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await aibaJetton.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            null,
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: aibaJetton.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and aibaJetton are ready to use
    });

    it('should increase counter', async () => {
        const increaseTimes = 3;
        for (let i = 0; i < increaseTimes; i++) {
            console.log(`increase ${i + 1}/${increaseTimes}`);

            const increaser = await blockchain.treasury('increaser' + i);

            const counterBefore = await aibaJetton.getCounter();

            console.log('counter before increasing', counterBefore);

            const increaseBy = BigInt(Math.floor(Math.random() * 100));

            console.log('increasing by', increaseBy);

            const increaseResult = await aibaJetton.send(
                increaser.getSender(),
                {
                    value: toNano('0.05'),
                },
                {
                    $$type: 'Add',
                    amount: increaseBy,
                },
            );

            expect(increaseResult.transactions).toHaveTransaction({
                from: increaser.address,
                to: aibaJetton.address,
                success: true,
            });

            const counterAfter = await aibaJetton.getCounter();

            console.log('counter after increasing', counterAfter);

            expect(counterAfter).toBe(counterBefore + increaseBy);
        }
    });
});
