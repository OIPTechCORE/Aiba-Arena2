import { Address, toNano } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';

import { AiAssetRegistry } from '../build/AiAssetRegistry/AiAssetRegistry_AiAssetRegistry';

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();
    const owner = provider.sender().address as Address;

    ui.write('Deploying AiAssetRegistry…');
    const registry = provider.open(await AiAssetRegistry.fromInit(owner));
    await registry.send(provider.sender(), { value: toNano('0.05') }, null);
    await provider.waitForDeploy(registry.address);
    ui.write(`AiAssetRegistry deployed: ${registry.address.toString()}`);
}
