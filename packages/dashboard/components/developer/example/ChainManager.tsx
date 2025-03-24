import { getWalletClient } from '@wagmi/core';
import { createDatilChainManager } from '@lit-protocol/vincent-contracts';
import { useConfig } from 'wagmi';
export default function ToBeRemoved() {
  const config = useConfig();

  async function _registerApp() {
    const walletClient = await getWalletClient(config);

    if (!walletClient) {
      console.error('No wallet client available');
      return;
    }

    // Creating the chain manager
    const chainManager = createDatilChainManager({
      account: walletClient,
      network: 'datil-mainnet',
    });

    // Use the APIs, in this example we will use the appManagerDashboard API

    const { appManagerDashboard } = chainManager.vincentApi;

    const res = await appManagerDashboard.registerApp({
      appName: 'Test App',
      appDescription: 'Test Description',
      authorizedRedirectUris: ['http://localhost:3000'],
      delegatees: [walletClient.account.address],
      toolIpfsCids: ['QmUT4Ke8cPtJYRZiWrkoG9RZc77hmRETNQjvDYfLtrMUEY'],
      toolPolicies: [['QmcLbQPohPURMuNdhYYa6wyDp9pm6eHPdHv9TRgFkPVebE']],
      toolPolicyParameterNames: [[['param1']]],
      toolPolicyParameterTypes: [[['BYTES']]],
    });

    console.log(res);
  }

  return (
    <div className="bg-gray-100 p-4 rounded-lg">
      <h1 className="text-2xl font-bold mb-4">Example: ChainManager.tsx</h1>
      <ul className="list-disc pl-5">
        <li className="mb-2">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
            onClick={_registerApp}
          >
            Register App
          </button>
        </li>
      </ul>
    </div>
  );
}
