import { ethers } from 'ethers';

/**
 * Reads app ownership data from the Vincent Diamond contract on Chronicle Yellowstone
 *
 * @param vincentContractAddress - The address of the Vincent Diamond contract
 * @param appId - The app ID to check ownership for
 * @param owner - The address to verify as owner
 * @param rpcUrl - The RPC URL for Chronicle Yellowstone
 * @returns true if the address is an owner of the app
 */
export async function verifyAppOwnership(
  vincentContractAddress: string,
  appId: number,
  owner: string,
  rpcUrl: string,
): Promise<boolean> {
  console.log(`Verifying app ownership for appId ${appId}, owner ${owner}`);
  console.log(`Vincent contract: ${vincentContractAddress}, RPC: ${rpcUrl}`);

  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

  // The ABI for the getApp function from VincentAppViewFacet
  // We only need the parts of the App struct we care about
  const abi = [
    'function getApp(uint40 appId) view returns (tuple(address manager, address[] delegatees, tuple(string[] abilities, string[] policies)[] versions, uint40[] deprecatedVersionIds))',
  ];

  const contract = new ethers.Contract(vincentContractAddress, abi, provider);

  try {
    const appData = await contract.getApp(appId);
    const manager = appData[0]; // manager is the first element

    console.log(`App manager: ${manager}`);
    console.log(`Checking if ${owner} is the manager`);

    // Check if the owner matches the app manager
    return manager.toLowerCase() === owner.toLowerCase();
  } catch (error) {
    console.error('Error reading from Vincent contract:', error);
    throw new Error(
      `Failed to verify app ownership: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
