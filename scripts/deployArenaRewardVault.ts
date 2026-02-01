import { Address, toNano } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { keyPairFromSeed } from '@ton/crypto';
import { ArenaRewardVault } from '../build/ArenaRewardVault/ArenaRewardVault_ArenaRewardVault';

function parseSeedHex(seedHex: string): Buffer {
    const hex = seedHex.trim().replace(/^0x/i, '');
    const buf = Buffer.from(hex, 'hex');
    if (buf.length !== 32) throw new Error('ORACLE_PRIVATE_KEY_HEX must be 32 bytes (64 hex chars)');
    return buf;
}

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const owner = provider.sender().address as Address;

    const jettonMaster = Address.parse(args[0] || (await ui.input('AIBA Jetton master address (AibaToken)')));

    const seedHex = await ui.input('ORACLE_PRIVATE_KEY_HEX (32-byte seed, hex)');
    const kp = keyPairFromSeed(parseSeedHex(seedHex));
    const oraclePublicKey = BigInt('0x' + Buffer.from(kp.publicKey).toString('hex'));

    ui.write(`Oracle public key (uint256): 0x${Buffer.from(kp.publicKey).toString('hex')}`);

    const vault = provider.open(await ArenaRewardVault.fromInit(owner, oraclePublicKey, jettonMaster));

    await vault.send(
        provider.sender(),
        {
            value: toNano('0.08'),
        },
        null
    );

    await provider.waitForDeploy(vault.address);
    ui.write(`ArenaRewardVault deployed at: ${vault.address.toString()}`);
    ui.write(`Vault Jetton wallet (computed in contract): call getVaultJettonWallet() after deploy`);
}

