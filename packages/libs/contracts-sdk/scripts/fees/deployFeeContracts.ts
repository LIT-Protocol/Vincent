import { execSync } from 'child_process';
import * as path from 'path';

import { ethers } from 'ethers';

import FeeDiamondAbi from '../../abis/FeeDiamond.abi.json';
import { VINCENT_CONTRACT_ADDRESS_BOOK } from '../../src/constants';

/**
 * Aave-supported chains mapping:
 * Chain ID -> { networkName (for forge script), camelCaseName (for constants.ts), aaveAddressBookName (for @bgd-labs/aave-address-book) }
 */
const AAVE_SUPPORTED_CHAINS = [
  // Mainnets
  {
    chainId: 1,
    networkName: 'mainnet',
    camelCaseName: 'ethereum',
    aaveAddressBookName: 'ethereum',
  },
  {
    chainId: 137,
    networkName: 'polygon',
    camelCaseName: 'polygon',
    aaveAddressBookName: 'polygon',
  },
  {
    chainId: 43114,
    networkName: 'avalanche',
    camelCaseName: 'avalanche',
    aaveAddressBookName: 'avalanche',
  },
  {
    chainId: 42161,
    networkName: 'arbitrum_one',
    camelCaseName: 'arbitrum',
    aaveAddressBookName: 'arbitrum',
  },
  {
    chainId: 10,
    networkName: 'optimism',
    camelCaseName: 'optimism',
    aaveAddressBookName: 'optimism',
  },
  { chainId: 8453, networkName: 'base', camelCaseName: 'base', aaveAddressBookName: 'base' },
  { chainId: 56, networkName: 'bnb', camelCaseName: 'bnb', aaveAddressBookName: 'bnb' },
  { chainId: 100, networkName: 'gnosis', camelCaseName: 'gnosis', aaveAddressBookName: 'gnosis' },
  {
    chainId: 534352,
    networkName: 'scroll',
    camelCaseName: 'scroll',
    aaveAddressBookName: 'scroll',
  },
  { chainId: 1088, networkName: 'metis', camelCaseName: 'metis', aaveAddressBookName: 'metis' },
  { chainId: 59144, networkName: 'linea', camelCaseName: 'linea', aaveAddressBookName: 'linea' },
  { chainId: 324, networkName: 'zksync', camelCaseName: 'zksync', aaveAddressBookName: 'zksync' },
  // Testnets
  {
    chainId: 11155111,
    networkName: 'sepolia',
    camelCaseName: 'sepolia',
    aaveAddressBookName: 'sepolia',
  },
  {
    chainId: 84532,
    networkName: 'base_sepolia',
    camelCaseName: 'baseSepolia',
    aaveAddressBookName: 'basesepolia',
  },
  {
    chainId: 421614,
    networkName: 'arbitrum_one_sepolia',
    camelCaseName: 'arbitrumSepolia',
    aaveAddressBookName: 'arbitrumsepolia',
  },
  {
    chainId: 11155420,
    networkName: 'optimism_sepolia',
    camelCaseName: 'optimismSepolia',
    aaveAddressBookName: 'optimismsepolia',
  },
  {
    chainId: 534351,
    networkName: 'scroll_sepolia',
    camelCaseName: 'scrollSepolia',
    aaveAddressBookName: 'scrollsepolia',
  },
] as const;

/**
 * Mapping from aaveAddressBookName to Aave Address Book exports
 */
const AAVE_ADDRESS_BOOK_MAP: Record<string, () => { POOL: string }> = {
  ethereum: () => require('@bgd-labs/aave-address-book').AaveV3Ethereum,
  polygon: () => require('@bgd-labs/aave-address-book').AaveV3Polygon,
  avalanche: () => require('@bgd-labs/aave-address-book').AaveV3Avalanche,
  arbitrum: () => require('@bgd-labs/aave-address-book').AaveV3Arbitrum,
  optimism: () => require('@bgd-labs/aave-address-book').AaveV3Optimism,
  base: () => require('@bgd-labs/aave-address-book').AaveV3Base,
  bnb: () => require('@bgd-labs/aave-address-book').AaveV3BNB,
  gnosis: () => require('@bgd-labs/aave-address-book').AaveV3Gnosis,
  scroll: () => require('@bgd-labs/aave-address-book').AaveV3Scroll,
  metis: () => require('@bgd-labs/aave-address-book').AaveV3Metis,
  linea: () => require('@bgd-labs/aave-address-book').AaveV3Linea,
  zksync: () => require('@bgd-labs/aave-address-book').AaveV3ZkSync,
  sepolia: () => require('@bgd-labs/aave-address-book').AaveV3Sepolia,
  basesepolia: () => require('@bgd-labs/aave-address-book').AaveV3BaseSepolia,
  arbitrumsepolia: () => require('@bgd-labs/aave-address-book').AaveV3ArbitrumSepolia,
  optimismsepolia: () => require('@bgd-labs/aave-address-book').AaveV3OptimismSepolia,
  scrollsepolia: () => require('@bgd-labs/aave-address-book').AaveV3ScrollSepolia,
};

interface DeploymentResult {
  chainId: number;
  networkName: string;
  camelCaseName: string;
  address: string;
  salt: string;
  wasAlreadyDeployed: boolean;
}

/**
 * Get deployer address from private key
 */
function getDeployerAddress(privateKey: string): string {
  const wallet = new ethers.Wallet(privateKey);
  return wallet.address;
}

/**
 * Check balance of deployer address on a specific chain
 */
async function checkBalance(
  rpcUrl: string,
  deployerAddress: string,
): Promise<{ balance: string; hasBalance: boolean }> {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const balance = await provider.getBalance(deployerAddress);
  const balanceInEth = ethers.utils.formatEther(balance);
  return {
    balance: balanceInEth,
    hasBalance: !balance.isZero(),
  };
}

/**
 * Check if a chain is already deployed
 */
function isChainAlreadyDeployed(camelCaseName: string): boolean {
  return VINCENT_CONTRACT_ADDRESS_BOOK.fee && camelCaseName in VINCENT_CONTRACT_ADDRESS_BOOK.fee;
}

/**
 * Get RPC URL from environment variable
 */
function getRpcUrl(networkName: string): string {
  const envVarName = `${networkName.toUpperCase().replace(/-/g, '_')}_RPC_URL`;
  const rpcUrl = process.env[envVarName];
  if (!rpcUrl) {
    throw new Error(`RPC URL not found. Please set ${envVarName} in your .env file`);
  }
  return rpcUrl;
}

/**
 * Get Aave pool address from address book
 */
function getAavePoolAddress(aaveAddressBookName: string): string {
  try {
    const addressBookGetter = AAVE_ADDRESS_BOOK_MAP[aaveAddressBookName.toLowerCase()];
    if (!addressBookGetter) {
      throw new Error(`No Aave address book mapping for: ${aaveAddressBookName}`);
    }
    const addressBook = addressBookGetter();
    if (!addressBook.POOL) {
      throw new Error(`Aave address book for ${aaveAddressBookName} does not have POOL address`);
    }
    return addressBook.POOL;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get Aave pool address for ${aaveAddressBookName}: ${errorMessage}`);
  }
}

/**
 * Parse deployed address from forge script output
 */
function parseDeployedAddress(output: string): string | null {
  // Look for "Fee Diamond deployed for" followed by the address
  const match = output.match(/Fee Diamond deployed for[^\n]*to:\s*(0x[a-fA-F0-9]{40})/i);
  if (match) {
    return match[1];
  }
  // Alternative pattern if the above doesn't match
  const altMatch = output.match(/deployed[^\n]*to:\s*(0x[a-fA-F0-9]{40})/i);
  return altMatch ? altMatch[1] : null;
}

/**
 * Run forge script to deploy fee contracts
 */
function runForgeScript(
  networkName: string,
  vincentProdDiamondAddress: string,
  privateKey: string,
  rpcUrl: string,
  etherscanApiKey: string,
): string {
  const projectRoot = path.resolve(__dirname, '../..');
  const scriptPath = path.join(projectRoot, 'script/DeployFeeDiamond.sol:DeployFeeDiamond');

  const command = [
    'forge script',
    scriptPath,
    `--sig "deployAndSetDefaults(address)" "${vincentProdDiamondAddress}"`,
    `--private-key "${privateKey}"`,
    `--rpc-url "${rpcUrl}"`,
    '--broadcast',
    '--slow',
    '--verify',
    '--ffi',
    `--etherscan-api-key "${etherscanApiKey}"`,
  ].join(' ');

  try {
    const output = execSync(command, {
      encoding: 'utf-8',
      stdio: 'pipe',
      cwd: projectRoot,
      env: {
        ...process.env,
        VINCENT_DEPLOYER_PRIVATE_KEY: privateKey,
      },
    });
    return output;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'stdout' in error) {
      const stdout = (error as { stdout?: string }).stdout;
      const stderr = (error as { stderr?: string }).stderr;
      throw new Error(`Forge script failed:\nSTDOUT: ${stdout}\nSTDERR: ${stderr}`);
    }
    throw error;
  }
}

/**
 * Check if Aave pool is set on the fee diamond contract
 */
async function getAavePoolFromContract(feeDiamondAddress: string, rpcUrl: string): Promise<string> {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(feeDiamondAddress, FeeDiamondAbi, provider);
  const aavePoolAddress = await contract.aavePool();
  return aavePoolAddress;
}

/**
 * Set Aave pool address on the fee diamond contract
 */
async function setAavePoolOnContract(
  feeDiamondAddress: string,
  aavePoolAddress: string,
  privateKey: string,
  rpcUrl: string,
): Promise<void> {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(feeDiamondAddress, FeeDiamondAbi, wallet);

  console.log(`   Setting Aave pool to ${aavePoolAddress}...`);
  const tx = await contract.setAavePool(aavePoolAddress);
  console.log(`   Transaction hash: ${tx.hash}`);
  await tx.wait();
  console.log(`   ✅ Aave pool set successfully`);
}

/**
 * Deploy fee contracts to a single chain
 */
async function deployToChain(
  chain: (typeof AAVE_SUPPORTED_CHAINS)[number],
): Promise<DeploymentResult | null> {
  const { chainId, networkName, camelCaseName, aaveAddressBookName } = chain;

  console.log(`\n${'='.repeat(80)}`);
  console.log(`Processing chain: ${networkName} (Chain ID: ${chainId})`);
  console.log(`${'='.repeat(80)}`);

  // Check if already deployed
  const wasAlreadyDeployed = isChainAlreadyDeployed(camelCaseName);
  let feeDiamondAddress: string;
  if (wasAlreadyDeployed) {
    const existing =
      VINCENT_CONTRACT_ADDRESS_BOOK.fee[
        camelCaseName as keyof typeof VINCENT_CONTRACT_ADDRESS_BOOK.fee
      ];
    feeDiamondAddress = existing.address;
    console.log(
      `⏭️  Chain ${networkName} is already deployed at ${feeDiamondAddress}. Skipping deployment...`,
    );
  } else {
    // Get required environment variables
    const privateKey = process.env.VINCENT_DEPLOYER_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('VINCENT_DEPLOYER_PRIVATE_KEY is not set in environment');
    }

    const vincentProdDiamondAddress = process.env.VINCENT_PROD_DIAMOND_ADDRESS;
    if (!vincentProdDiamondAddress) {
      throw new Error('VINCENT_PROD_DIAMOND_ADDRESS is not set in environment');
    }

    const etherscanApiKey = process.env.ETHERSCAN_API_KEY;
    if (!etherscanApiKey) {
      throw new Error('ETHERSCAN_API_KEY is not set in environment');
    }

    const deployerAddress = getDeployerAddress(privateKey);
    console.log(`Deployer address: ${deployerAddress}`);

    // Get RPC URL
    let rpcUrl: string;
    try {
      rpcUrl = getRpcUrl(networkName);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ ${errorMessage}`);
      return null;
    }

    // Check balance
    console.log(`Checking balance on ${networkName}...`);
    try {
      const { balance, hasBalance } = await checkBalance(rpcUrl, deployerAddress);
      console.log(`Balance: ${balance} ETH`);

      if (!hasBalance) {
        throw new Error(
          `❌ Deployer address ${deployerAddress} has zero balance on ${networkName}. Please fund the address before deploying.`,
        );
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error checking balance: ${errorMessage}`);
      return null;
    }

    // Run deployment script
    console.log(`🚀 Deploying fee contracts to ${networkName}...`);
    try {
      const output = runForgeScript(
        networkName,
        vincentProdDiamondAddress,
        privateKey,
        rpcUrl,
        etherscanApiKey,
      );

      console.log('Deployment output:');
      console.log(output);

      // Parse deployed address
      const deployedAddress = parseDeployedAddress(output);
      if (!deployedAddress) {
        console.error(
          `❌ Could not parse deployed address from output. Please check the deployment logs.`,
        );
        return null;
      }

      feeDiamondAddress = deployedAddress;
      console.log(`✅ Successfully deployed to ${networkName}`);
      console.log(`   Address: ${feeDiamondAddress}`);
    } catch (error: unknown) {
      console.error(`❌ Deployment failed for ${networkName}:`);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error:', errorMessage);
      return null;
    }
  }

  // Set Aave pool address (idempotent - only if not already set)
  try {
    const rpcUrl = getRpcUrl(networkName);

    console.log(`🔍 Checking Aave pool address on ${networkName}...`);
    const currentAavePool = await getAavePoolFromContract(feeDiamondAddress, rpcUrl);
    const zeroAddress = ethers.constants.AddressZero;

    if (currentAavePool.toLowerCase() === zeroAddress.toLowerCase()) {
      console.log(`   Current Aave pool is not set (0x00...000), setting it now...`);

      // Get Aave pool address from address book
      const aavePoolAddress = getAavePoolAddress(aaveAddressBookName);
      console.log(`   Aave pool address from address book: ${aavePoolAddress}`);

      // Set the Aave pool address
      const privateKey = process.env.VINCENT_DEPLOYER_PRIVATE_KEY;
      if (!privateKey) {
        throw new Error('VINCENT_DEPLOYER_PRIVATE_KEY is not set in environment');
      }

      await setAavePoolOnContract(feeDiamondAddress, aavePoolAddress, privateKey, rpcUrl);
    } else {
      console.log(`   ✅ Aave pool already set to: ${currentAavePool}`);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error setting Aave pool for ${networkName}: ${errorMessage}`);
    // Don't fail the deployment if setting Aave pool fails
  }

  return {
    chainId,
    networkName,
    camelCaseName,
    address: feeDiamondAddress,
    salt: 'DatilCreate2Salt', // Default salt as per DeployFeeDiamond.sol
    wasAlreadyDeployed,
  };
}

/**
 * Format deployment result for constants.ts
 */
function formatForConstants(result: DeploymentResult): string {
  return `    ${result.camelCaseName}: {
      chainId: ${result.chainId},
      address: '${result.address}',
      salt: '${result.salt}',
    },`;
}

/**
 * Main deployment function
 */
async function main() {
  console.log('Starting fee contract deployment to all Aave-supported chains...\n');

  const results: DeploymentResult[] = [];

  for (const chain of AAVE_SUPPORTED_CHAINS) {
    const result = await deployToChain(chain);
    if (result) {
      results.push(result);

      // Output individual result
      console.log(`\n📋 Copy this for ${chain.networkName}:`);
      console.log(formatForConstants(result));
    }
  }

  // Output all results at the end
  console.log(`\n${'='.repeat(80)}`);
  console.log('📋 All deployed chains (copy this into VINCENT_CONTRACT_ADDRESS_BOOK.fee):');
  console.log(`${'='.repeat(80)}\n`);
  console.log('export const VINCENT_CONTRACT_ADDRESS_BOOK = {');
  console.log('  fee: {');
  for (const result of results) {
    console.log(formatForConstants(result));
  }
  console.log('  },');
  console.log('};');
  console.log(`\n${'='.repeat(80)}`);

  const deployedCount = results.filter((r) => !r.wasAlreadyDeployed).length;
  const skippedCount = results.filter((r) => r.wasAlreadyDeployed).length;

  console.log(`\n✅ Deployment complete!`);
  console.log(`   - Deployed to ${deployedCount} new chain(s)`);
  console.log(`   - Skipped ${skippedCount} already deployed chain(s)`);
  console.log(`   - Total: ${results.length} chain(s)`);
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
