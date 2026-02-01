import { disconnectVincentAbilityClients } from '@lit-protocol/vincent-app-sdk/abilityClient';
import { createPublicClient, formatUnits, http, parseUnits } from 'viem';

import { loadConfig } from '../lib/config';
import { buildUserOp } from '../lib/executor/buildUserOp';
import { signUserOp } from '../lib/executor/signUserOp';
import { submitUserOp } from '../lib/executor/submitUserOp';
import { selectTopPool } from '../lib/strategy/selectTopPool';
import { ERC20_ABI } from '../lib/utils/erc20';

async function main() {
  // 1. Load env/config.
  const config = loadConfig();

  // 2. Create Base RPC client.
  const baseClient = createPublicClient({
    chain: config.chain,
    transport: http(config.baseRpcUrl),
  });

  // 3. Select the top Aave pool on Base.
  const topPool = await selectTopPool({
    client: baseClient,
    chainId: config.chainId,
    allowlistSymbols: config.allowlistSymbols,
  });

  console.log('[strategy] selected pool', {
    asset: topPool.asset,
    symbol: topPool.symbol,
    apr: topPool.apr,
    totalSupply: topPool.totalSupply,
  });

  // 4. Resolve amount + balance check.
  const amount = parseUnits(config.depositAmount, topPool.decimals);
  const balance = (await baseClient.readContract({
    address: topPool.asset,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [config.agentAddress],
  })) as bigint;

  if (balance < amount) {
    throw new Error(
      `Insufficient ${topPool.symbol} balance on agent. Need ${config.depositAmount}, have ${formatUnits(
        balance,
        topPool.decimals,
      )}.`,
    );
  }

  // 5. Build the UserOp (approval + supply).
  const userOp = await buildUserOp({
    baseClient,
    agentAddress: config.agentAddress,
    asset: topPool.asset,
    amount,
    appId: config.appId,
    chain: config.chain,
    zerodevRpcUrl: config.zerodevRpcUrl,
    serializedPermissionAccount: config.serializedPermissionAccount,
  });

  // 6. Precheck + execute to get a signature.
  const { signature } = await signUserOp({
    userOp,
    alchemyRpcUrl: config.alchemyRpcUrl,
    delegateePrivateKey: config.delegateePrivateKey,
    delegatorPkpEthAddress: config.delegatorPkpAddress,
    agentAddress: config.agentAddress,
  });

  // 7. Submit the signed UserOp.
  const receipt = await submitUserOp({
    agentAddress: config.agentAddress,
    serializedPermissionAccount: config.serializedPermissionAccount,
    userOpSignature: signature,
    userOp,
    chain: config.chain,
    zerodevRpcUrl: config.zerodevRpcUrl,
  });

  console.log('[submit] userOp included', receipt);
}

void (async () => {
  try {
    await main();
  } catch (error) {
    console.error('[aave-yield-v1] failed', error);
    process.exitCode = 1;
  } finally {
    await disconnectVincentAbilityClients();
  }
})();
