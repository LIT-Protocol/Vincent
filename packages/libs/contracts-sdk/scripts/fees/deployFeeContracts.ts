import { execSync } from 'child_process';
import * as path from 'path';

import { ethers } from 'ethers';

import { VINCENT_CONTRACT_ADDRESS_BOOK } from '../../src/constants';

/**
 * Aave-supported chains mapping:
 * Chain ID -> { networkName (for shell script), camelCaseName (for constants.ts) }
 */
const AAVE_SUPPORTED_CHAINS = [
  // Mainnets
  { chainId: 1, networkName: 'mainnet', camelCaseName: 'ethereum' },
  { chainId: 137, networkName: 'polygon', camelCaseName: 'polygon' },
  { chainId: 43114, networkName: 'avalanche', camelCaseName: 'avalanche' },
  { chainId: 42161, networkName: 'arbitrum_one', camelCaseName: 'arbitrum' },
  { chainId: 10, networkName: 'optimism', camelCaseName: 'optimism' },
  { chainId: 8453, networkName: 'base', camelCaseName: 'base' },
  { chainId: 56, networkName: 'bnb', camelCaseName: 'bnb' },
  { chainId: 100, networkName: 'gnosis', camelCaseName: 'gnosis' },
  { chainId: 534352, networkName: 'scroll', camelCaseName: 'scroll' },
  { chainId: 1088, networkName: 'metis', camelCaseName: 'metis' },
  { chainId: 59144, networkName: 'linea', camelCaseName: 'linea' },
  { chainId: 324, networkName: 'zksync', camelCaseName: 'zksync' },
  // Testnets
  { chainId: 11155111, networkName: 'sepolia', camelCaseName: 'sepolia' },
  { chainId: 84532, networkName: 'base_sepolia', camelCaseName: 'baseSepolia' },
  { chainId: 421614, networkName: 'arbitrum_one_sepolia', camelCaseName: 'arbitrumSepolia' },
  { chainId: 11155420, networkName: 'optimism_sepolia', camelCaseName: 'optimismSepolia' },
  { chainId: 534351, networkName: 'scroll_sepolia', camelCaseName: 'scrollSepolia' },
] as const;

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
 * Deploy fee contracts to a single chain
 */
async function deployToChain(
  chain: (typeof AAVE_SUPPORTED_CHAINS)[number],
): Promise<DeploymentResult | null> {
  const { chainId, networkName, camelCaseName } = chain;

  console.log(`\n${'='.repeat(80)}`);
  console.log(`Processing chain: ${networkName} (Chain ID: ${chainId})`);
  console.log(`${'='.repeat(80)}`);

  // Check if already deployed
  const wasAlreadyDeployed = isChainAlreadyDeployed(camelCaseName);
  if (wasAlreadyDeployed) {
    const existing =
      VINCENT_CONTRACT_ADDRESS_BOOK.fee[
        camelCaseName as keyof typeof VINCENT_CONTRACT_ADDRESS_BOOK.fee
      ];
    console.log(`⏭️  Chain ${networkName} is already deployed at ${existing.address}. Skipping...`);
    return {
      chainId: existing.chainId ?? chainId,
      networkName,
      camelCaseName,
      address: existing.address,
      salt: existing.salt,
      wasAlreadyDeployed: true,
    };
  }

  // Get required environment variables
  const privateKey = process.env.VINCENT_DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('VINCENT_DEPLOYER_PRIVATE_KEY is not set in environment');
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
  const scriptPath = path.join(__dirname, 'deploy_fee_contracts_to_one_chain.sh');

  try {
    const output = execSync(`bash "${scriptPath}" "${networkName}"`, {
      encoding: 'utf-8',
      stdio: 'pipe',
      env: {
        ...process.env,
        VINCENT_DEPLOYER_PRIVATE_KEY: privateKey,
      },
    });

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

    console.log(`✅ Successfully deployed to ${networkName}`);
    console.log(`   Address: ${deployedAddress}`);

    return {
      chainId,
      networkName,
      camelCaseName,
      address: deployedAddress,
      salt: 'DatilCreate2Salt', // Default salt as per DeployFeeDiamond.sol
      wasAlreadyDeployed: false,
    };
  } catch (error: unknown) {
    console.error(`❌ Deployment failed for ${networkName}:`);
    if (error && typeof error === 'object' && 'stdout' in error) {
      console.error('STDOUT:', (error as { stdout?: string }).stdout);
    }
    if (error && typeof error === 'object' && 'stderr' in error) {
      console.error('STDERR:', (error as { stderr?: string }).stderr);
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error:', errorMessage);
    return null;
  }
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
