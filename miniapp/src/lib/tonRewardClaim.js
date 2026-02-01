import { Address, beginCell } from '@ton/core';

const REWARD_CLAIM_OP = 0x3b5d2b44;

export function buildRewardClaimPayload({
    toAddress,
    amount, // integer string
    seqno,
    validUntil,
    signatureBase64, // 64 bytes
}) {
    const sig = Uint8Array.from(atob(signatureBase64), (c) => c.charCodeAt(0));
    if (sig.length !== 64) throw new Error('Invalid signature length (expected 64 bytes)');

    let b = beginCell()
        .storeUint(REWARD_CLAIM_OP, 32)
        .storeAddress(Address.parse(toAddress))
        .storeCoins(BigInt(amount))
        .storeUint(BigInt(seqno), 64)
        .storeUint(BigInt(validUntil), 32);

    // Store signature as 64 bytes (512 bits) without relying on Buffer polyfills.
    for (let i = 0; i < sig.length; i++) {
        b = b.storeUint(sig[i], 8);
    }

    const cell = b.endCell();

    return cell.toBoc().toString('base64');
}

