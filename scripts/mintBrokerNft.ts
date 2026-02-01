import { Address, beginCell, toNano } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';

import { BrokerNftCollection } from '../build/BrokerNFT/BrokerNftCollection_BrokerNftCollection';

function buildOffchainUriCell(uri: string) {
    // Common "off-chain content" prefix used by TON NFT standards.
    // 0x01 + string (URI)
    return beginCell().storeUint(0x01, 8).storeStringTail(uri).endCell();
}

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();

    const collectionAddressStr = await ui.input('BROKER_NFT_COLLECTION_ADDRESS');
    const recipientStr = await ui.input('Recipient wallet address (EQ...)');
    const metadataUri = await ui.input('Metadata URI (https://.../api/metadata/brokers/<brokerId>)');

    const collectionAddress = Address.parse(collectionAddressStr.trim());
    const recipient = Address.parse(recipientStr.trim());

    // Note: Mint is owner-only; run this script from the collection owner wallet.
    const collection = provider.open(BrokerNftCollection.fromAddress(collectionAddress));
    const metadata = buildOffchainUriCell(metadataUri.trim());

    ui.write('Sending mint transaction…');
    await collection.send(
        provider.sender(),
        { value: toNano('0.4') },
        { $$type: 'MintBroker', to: recipient, metadata },
    );

    ui.write('Mint message sent.');
    ui.write('Next step: read the collection `next_item_index` before/after mint to determine the minted item index,');
    ui.write(
        'then call backend admin endpoint `/api/admin/brokers/:id/link-nft` to link the DB broker to the minted NFT.',
    );
}
