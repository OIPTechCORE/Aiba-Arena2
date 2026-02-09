import { Address, toNano } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';

import { AiAssetRegistry } from '../build/AiAssetRegistry/AiAssetRegistry_AiAssetRegistry';

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();
    const registryStr = await ui.input('AI Asset Registry address');
    const operatorStr = await ui.input('Operator address to set');
    const activeStr = await ui.input('Active? (true/false)');

    const registry = provider.open(AiAssetRegistry.fromAddress(Address.parse(registryStr.trim())));
    const operator = Address.parse(operatorStr.trim());
    const active = activeStr.trim().toLowerCase() === 'true';

    await registry.send(provider.sender(), { value: toNano('0.05') }, { $$type: 'SetOperator', operator, active });
    ui.write(`Operator ${operator.toString()} set to ${active}`);
}
