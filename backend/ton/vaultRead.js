const TonWeb = require('tonweb');

function getTonweb() {
    const endpoint = process.env.TON_PROVIDER_URL || 'https://testnet.toncenter.com/api/v2/jsonRPC';
    const apiKey = process.env.TON_API_KEY || undefined;
    const provider = new TonWeb.HttpProvider(endpoint, apiKey ? { apiKey } : undefined);
    return new TonWeb(provider);
}

function parseStackNum(x) {
    // Toncenter usually returns hex string like "0x1" (or decimal as string)
    if (typeof x === 'number') return BigInt(x);
    const s = String(x);
    if (s.startsWith('0x') || s.startsWith('-0x')) return BigInt(s);
    return BigInt(s);
}

function decodeCellFromTvmBytes(bytesB64) {
    if (!bytesB64) throw new Error('missing tvm bytes');
    const bytes = TonWeb.utils.base64ToBytes(String(bytesB64));
    return TonWeb.boc.Cell.oneFromBoc(bytes);
}

function parseSliceAddress(value) {
    // Toncenter runGetMethod usually returns slice as: { bytes: "..." }
    const bytesB64 = value?.bytes || value?.slice?.bytes || value?.cell?.bytes;
    if (!bytesB64) throw new Error('unsupported slice format');
    const cell = decodeCellFromTvmBytes(bytesB64);
    const sl = cell.beginParse();
    const addr = sl.loadAddress();
    if (!addr) throw new Error('slice does not contain address');
    return addr;
}

function parseTupleValue(value) {
    const typeName = value?.['@type'];
    if (typeName !== 'tvm.tuple' && typeName !== 'tvm.list') throw new Error(`unsupported tuple type: ${typeName}`);
    const elements = value.elements || [];
    return elements.map(parseTvmStackEntry);
}

function parseTvmStackEntry(entry) {
    const typeName = entry?.['@type'];
    if (typeName === 'tvm.stackEntryNumber') {
        return parseStackNum(entry.number?.number);
    }
    if (typeName === 'tvm.stackEntryTuple') return parseTupleValue(entry.tuple);
    if (typeName === 'tvm.stackEntryList') return parseTupleValue(entry.list);
    if (typeName === 'tvm.stackEntryCell') {
        return decodeCellFromTvmBytes(entry.cell?.bytes);
    }
    if (typeName === 'tvm.stackEntrySlice') {
        // Return slice object raw, or parse address when needed
        return entry.slice;
    }
    throw new Error(`unknown stack entry type: ${typeName}`);
}

async function getVaultLastSeqno(vaultAddress, toAddress) {
    const tonweb = getTonweb();

    const addr = new TonWeb.utils.Address(toAddress);
    const cell = new TonWeb.boc.Cell();
    cell.bits.writeAddress(addr);
    const slice = cell.beginParse();

    const res = await tonweb.call(vaultAddress, 'getLastSeqno', [['slice', slice]]);

    const stack0 = res?.stack?.[0];
    if (!stack0) throw new Error('empty stack');

    // stack item formats may vary, handle common ones:
    // - ['num', '0x01']
    // - { type: 'num', value: '0x01' }
    if (Array.isArray(stack0)) {
        const [type, value] = stack0;
        if (type !== 'num') throw new Error(`unexpected stack type: ${type}`);
        return parseStackNum(value);
    }
    if (stack0.type === 'num') return parseStackNum(stack0.value);

    throw new Error('unrecognized stack format');
}

async function getVaultJettonWalletAddress(vaultAddress) {
    const tonweb = getTonweb();
    const res = await tonweb.call(vaultAddress, 'getVaultJettonWallet', []);

    const stack0 = res?.stack?.[0];
    if (!stack0) throw new Error('empty stack');

    // Expect address is returned as slice
    if (Array.isArray(stack0)) {
        const [type, value] = stack0;
        if (type !== 'slice') throw new Error(`unexpected stack type: ${type}`);
        const addr = parseSliceAddress(value);
        return {
            raw: addr.toString(false),
            userFriendly: addr.toString(true, true, true, addr.isTestOnly),
        };
    }
    throw new Error('unrecognized stack format');
}

async function getJettonWalletData(walletAddress) {
    const tonweb = getTonweb();
    const res = await tonweb.call(walletAddress, 'get_wallet_data', []);

    const stack0 = res?.stack?.[0];
    if (!stack0) throw new Error('empty stack');

    // Expect tuple
    if (Array.isArray(stack0)) {
        const [type, value] = stack0;
        if (type !== 'tuple' && type !== 'list') throw new Error(`unexpected stack type: ${type}`);

        // `value` is tvm.tuple or tvm.list
        const parsed = parseTupleValue(value);
        // JettonWalletData fields: balance, owner, master, walletCode
        const balance = parsed?.[0];
        return { balance: BigInt(balance || 0) };
    }

    throw new Error('unrecognized stack format');
}

async function getVaultInventory(vaultAddress) {
    const tonweb = getTonweb();
    const tonBalanceNano = await tonweb.getBalance(vaultAddress);
    const walletAddr = await getVaultJettonWalletAddress(vaultAddress);
    const walletData = await getJettonWalletData(walletAddr.raw);

    return {
        vaultAddress,
        tonBalanceNano: String(tonBalanceNano),
        vaultJettonWallet: walletAddr,
        jettonBalance: walletData.balance.toString(),
    };
}

module.exports = {
    getVaultLastSeqno,
    getVaultJettonWalletAddress,
    getVaultInventory,
};
