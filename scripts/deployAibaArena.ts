import { Address, toNano } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { keyPairFromSeed } from '@ton/crypto';

import { AibaToken } from '../build/AibaToken/AibaToken_AibaToken';
import { ArenaRewardVault } from '../build/ArenaRewardVault/ArenaRewardVault_ArenaRewardVault';

function parseSeedHex(seedHex: string): Buffer {
    const hex = seedHex.trim().replace(/^0x/i, '');
    const buf = Buffer.from(hex, 'hex');
    if (buf.length !== 32) throw new Error('ORACLE_PRIVATE_KEY_HEX must be 32 bytes (64 hex chars)');
    return buf;
}

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();
    const owner = provider.sender().address as Address;

    ui.write('Deploying AibaToken…');
    const token = provider.open(await AibaToken.fromInit(owner, null));
    await token.send(provider.sender(), { value: toNano('0.07') }, null);
    await provider.waitForDeploy(token.address);
    ui.write(`AibaToken deployed: ${token.address.toString()}`);

    const seedHex = await ui.input('ORACLE_PRIVATE_KEY_HEX (32-byte seed, hex)');
    const kp = keyPairFromSeed(parseSeedHex(seedHex));
    const oraclePublicKey = BigInt('0x' + Buffer.from(kp.publicKey).toString('hex'));
    ui.write(`Oracle public key (uint256): 0x${Buffer.from(kp.publicKey).toString('hex')}`);

    ui.write('Deploying ArenaRewardVault…');
    const vault = provider.open(await ArenaRewardVault.fromInit(owner, oraclePublicKey, token.address));
    await vault.send(provider.sender(), { value: toNano('0.08') }, null);
    await provider.waitForDeploy(vault.address);
    ui.write(`ArenaRewardVault deployed: ${vault.address.toString()}`);

    const amountStr = await ui.input('Initial reward inventory to mint to vault (integer, smallest units)');
    const amount = BigInt(amountStr.trim());

    ui.write(`Minting ${amount.toString()} AIBA to vault address…`);
    await token.send(
        provider.sender(),
        { value: toNano('0.1') },
        {
            $$type: 'Mint',
            to: vault.address,
            amount,
        }
    );

    ui.write('Mint message sent.');
    ui.write('');
    ui.write('Backend env snippet:');
    ui.write(`AIBA_JETTON_MASTER=${token.address.toString()}`);
    ui.write(`ARENA_VAULT_ADDRESS=${vault.address.toString()}`);
    ui.write(`ORACLE_PRIVATE_KEY_HEX=<keep same seed you entered>`);
}

