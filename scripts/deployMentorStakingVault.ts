import { Address, toNano } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';

import { MentorStakingVault } from '../build/MentorStakingVault/MentorStakingVault_MentorStakingVault';

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();
    const owner = provider.sender().address as Address;

    const jettonStr = await ui.input('AIBA Jetton master address');
    const apyStr = await ui.input('APY bps (e.g. 1500)');
    const jetton = Address.parse(jettonStr.trim());
    const apyBps = BigInt(apyStr.trim());

    ui.write('Deploying MentorStakingVault…');
    const vault = provider.open(await MentorStakingVault.fromInit(owner, jetton, apyBps));
    await vault.send(provider.sender(), { value: toNano('0.1') }, null);
    await provider.waitForDeploy(vault.address);
    ui.write(`MentorStakingVault deployed: ${vault.address.toString()}`);
}
