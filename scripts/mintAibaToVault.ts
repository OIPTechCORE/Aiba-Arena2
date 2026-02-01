import { Address, toNano } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { AibaToken } from '../build/AibaToken/AibaToken_AibaToken';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const tokenAddress = Address.parse(args[0] || (await ui.input('AibaToken address')));
    const vaultAddress = Address.parse(args[1] || (await ui.input('ArenaRewardVault address')));
    const amount = BigInt(args[2] || (await ui.input('Amount to mint to vault (integer, smallest units)')));

    if (!(await provider.isContractDeployed(tokenAddress))) {
        ui.write(`Error: Token at ${tokenAddress} is not deployed`);
        return;
    }
    if (!(await provider.isContractDeployed(vaultAddress))) {
        ui.write(`Error: Vault at ${vaultAddress} is not deployed`);
        return;
    }

    const token = provider.open(AibaToken.fromAddress(tokenAddress));

    await token.send(
        provider.sender(),
        { value: toNano('0.1') },
        {
            $$type: 'Mint',
            to: vaultAddress,
            amount,
        }
    );

    ui.write(`Mint sent. Vault should now have Jettons in its Jetton wallet.`);
}

