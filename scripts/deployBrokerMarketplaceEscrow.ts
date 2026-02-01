import { Address, toNano } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';

import { BrokerMarketplaceEscrow } from '../build/BrokerMarketplaceEscrow/BrokerMarketplaceEscrow_BrokerMarketplaceEscrow';

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();
    const owner = provider.sender().address!;

    const brokerCollectionAddress = Address.parse((await ui.input('BROKER_NFT_COLLECTION_ADDRESS')).trim());
    const jettonMasterAddress = Address.parse((await ui.input('AIBA_JETTON_MASTER (jetton master address)')).trim());
    const treasuryAddress = Address.parse((await ui.input('TREASURY_ADDRESS (fee recipient)')).trim());
    const feeBps = BigInt((await ui.input('FEE_BPS (e.g. 300 = 3%)')).trim());
    const burnBps = BigInt((await ui.input('BURN_BPS (<= fee, e.g. 0)')).trim());

    ui.write('Deploying BrokerMarketplaceEscrow…');
    const escrow = provider.open(
        await BrokerMarketplaceEscrow.fromInit(
            owner,
            brokerCollectionAddress,
            jettonMasterAddress,
            treasuryAddress,
            feeBps,
            burnBps,
        ),
    );
    await escrow.send(provider.sender(), { value: toNano('0.3') }, null);
    await provider.waitForDeploy(escrow.address);

    ui.write(`Escrow deployed: ${escrow.address.toString()}`);
    ui.write('');
    ui.write('Env snippet:');
    ui.write(`BROKER_MARKETPLACE_ESCROW=${escrow.address.toString()}`);
}
