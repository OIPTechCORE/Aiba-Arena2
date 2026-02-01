import { Address, toNano } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { AibaToken } from '../build/AibaToken/AibaToken_AibaToken';

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();

    // Keep metadata null for MVP. You can later switch to a proper TEP-64 metadata cell.
    const content = null;
    const owner = provider.sender().address as Address;

    const aibaToken = provider.open(await AibaToken.fromInit(owner, content));

    await aibaToken.send(
        provider.sender(),
        {
            value: toNano('0.07'),
        },
        null
    );

    await provider.waitForDeploy(aibaToken.address);
    ui.write(`AibaToken deployed at: ${aibaToken.address.toString()}`);
}

