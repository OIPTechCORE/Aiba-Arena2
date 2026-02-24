import { Address, beginCell } from '@ton/core';

const JETTON_TRANSFER_OP = 0xf8a7ea5;

export function buildJettonTransferPayload({ destination, responseAddress, amount, forwardPayloadCell }) {
    let cell = beginCell()
        .storeUint(JETTON_TRANSFER_OP, 32)
        .storeUint(0, 64)
        .storeCoins(BigInt(amount))
        .storeAddress(Address.parse(destination))
        .storeAddress(Address.parse(responseAddress))
        .storeBit(0); // no custom payload

    const forwardAmount = 0;
    cell = cell.storeCoins(BigInt(forwardAmount));

    if (forwardPayloadCell) {
        cell = cell.storeBit(1).storeRef(forwardPayloadCell);
    } else {
        cell = cell.storeBit(0);
    }

    return cell.endCell().toBoc().toString('base64');
}

export function buildListingForwardPayload(listingId) {
    return beginCell().storeUint(BigInt(listingId), 64).endCell();
}
