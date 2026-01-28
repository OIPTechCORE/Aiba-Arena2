import { toNano } from '@ton/core';
import { AibaJetton } from '../build/AibaJetton/AibaJetton_AibaJetton';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const aibaJetton = provider.open(await AibaJetton.fromInit(BigInt(Math.floor(Math.random() * 10000)), 0n));

    await aibaJetton.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        null,
    );

    await provider.waitForDeploy(aibaJetton.address);

    console.log('ID', await aibaJetton.getId());
}
