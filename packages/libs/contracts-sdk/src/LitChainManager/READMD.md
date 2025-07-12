# Usage

```ts
import { createWalletClient, http, privateKeyToAccount } from 'viem';
import { polygon } from 'viem/chains';
import { createDatilChainManager } from './LitChainManager/createChainManager';

// Setup a wallet client
const privateKey = process.env.PRIVATE_KEY as `0x${string}`;
const account = privateKeyToAccount(privateKey);

// Option 1: Using an account directly
const chainManager = createDatilChainManager({
  account,
  network: 'datil',
});

// Option 2: Using a wallet client
const walletClient = createWalletClient({
  account,
  chain: polygon,
  transport: http('https://polygon-rpc.com'),
});

const chainManagerWithWallet = createDatilChainManager({
  account: walletClient,
  network: 'datil',
});

// Now you can call methods directly without passing the network context
async function registerNewApp() {
  const result = await chainManager.vincentApi.appManagerDashboard.registerApp({
    appName: 'My New App',
    appDescription: 'A description of my application',
    authorizedRedirectUris: ['https://myapp.com/callback'],
    delegatees: ['0x1234567890abcdef1234567890abcdef12345678'],
    toolIpfsCids: ['QmUT4Ke8cPtJYRZiWrkoG9RZc77hmRETNQjvDYfLtrMUEY'],
    toolPolicies: [['QmcLbQPohPURMuNdhYYa6wyDp9pm6eHPdHv9TRgFkPVebE']],
    toolPolicyParameterNames: [[['param1']]],
    toolPolicyParameterTypes: [[['INT256']]],
  });

  console.log('App registered successfully:', result);
  return result.decodedLogs.find((log) => log.eventName === 'NewAppVersionRegistered')?.args.appId;
}

// Likewise, for read operations
async function getAppDetails(appId: bigint) {
  const appDetails = await chainManager.vincentApi.userDashboard.getAppById({
    appId,
  });
  console.log('App details:', appDetails);
  return appDetails;
}
```
