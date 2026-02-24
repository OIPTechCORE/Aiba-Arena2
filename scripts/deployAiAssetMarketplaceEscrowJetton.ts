import { Address, toNano } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';

import { AiAssetMarketplaceEscrowJetton } from '../build/AiAssetMarketplaceEscrowJetton/AiAssetMarketplaceEscrowJetton_AiAssetMarketplaceEscrowJetton';

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();
    const owner = provider.sender().address as Address;

    const registryStr = await ui.input('AI Asset Registry address');
    const jettonStr = await ui.input('AIBA Jetton master address');
    const treasuryStr = await ui.input('Treasury address');
    const feeBpsStr = await ui.input('Marketplace fee (bps, e.g. 300)');
    const burnBpsStr = await ui.input('Burn portion (bps, <= fee)');

    const registry = Address.parse(registryStr.trim());
    const jetton = Address.parse(jettonStr.trim());
    const treasury = Address.parse(treasuryStr.trim());
    const feeBps = BigInt(feeBpsStr.trim());
    const burnBps = BigInt(burnBpsStr.trim());

    ui.write('Deploying AiAssetMarketplaceEscrowJetton…');
    const escrow = provider.open(
        await AiAssetMarketplaceEscrowJetton.fromInit(owner, registry, jetton, treasury, feeBps, burnBps),
    );
    await escrow.send(provider.sender(), { value: toNano('0.1') }, null);
    await provider.waitForDeploy(escrow.address);
    ui.write(`AiAssetMarketplaceEscrowJetton deployed: ${escrow.address.toString()}`);
}
