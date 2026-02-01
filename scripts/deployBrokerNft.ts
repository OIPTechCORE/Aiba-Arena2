import { beginCell, toNano } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';

import { BrokerNftCollection } from '../build/BrokerNFT/BrokerNftCollection_BrokerNftCollection';

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();
    const owner = provider.sender().address!;

    // 0% royalties by default (can be changed by redeploying a new collection).
    const royalty = {
        numerator: 0n,
        denominator: 1n,
        destination: owner,
    };

    // Collection content can be a URI cell per NFT standards; for now keep it empty.
    const collectionContent = beginCell().endCell();

    ui.write('Deploying Broker NFT collection…');
    const collection = provider.open(await BrokerNftCollection.fromInit(owner, collectionContent, royalty));
    await collection.send(provider.sender(), { value: toNano('0.3') }, null);
    await provider.waitForDeploy(collection.address);

    ui.write(`Broker NFT collection deployed: ${collection.address.toString()}`);
    ui.write('');
    ui.write('Env snippet:');
    ui.write(`BROKER_NFT_COLLECTION_ADDRESS=${collection.address.toString()}`);
}
