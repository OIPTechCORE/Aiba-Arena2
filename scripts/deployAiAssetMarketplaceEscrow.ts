import { Address, toNano } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';

import { AiAssetMarketplaceEscrow } from '../build/AiAssetMarketplaceEscrow/AiAssetMarketplaceEscrow_AiAssetMarketplaceEscrow';

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();
    const owner = provider.sender().address as Address;

    const treasuryStr = await ui.input('Treasury address');
    const treasury = Address.parse(treasuryStr.trim());

    const feeBpsStr = await ui.input('Marketplace fee (bps, e.g. 300)');
    const burnBpsStr = await ui.input('Burn portion (bps, <= fee)');
    const feeBps = BigInt(feeBpsStr.trim());
    const burnBps = BigInt(burnBpsStr.trim());

    ui.write('Deploying AiAssetMarketplaceEscrow…');
    const escrow = provider.open(await AiAssetMarketplaceEscrow.fromInit(owner, treasury, feeBps, burnBps));
    await escrow.send(provider.sender(), { value: toNano('0.08') }, null);
    await provider.waitForDeploy(escrow.address);
    ui.write(`AiAssetMarketplaceEscrow deployed: ${escrow.address.toString()}`);
}
