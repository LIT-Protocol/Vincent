import type { Address, Chain, Hex } from 'viem';
import { http, createPublicClient } from 'viem';
import { toAccount } from 'viem/accounts';
import { createBundlerClient, entryPoint07Address } from 'viem/account-abstraction';
import { createSmartAccountClient } from 'permissionless';
import { toSafeSmartAccount } from 'permissionless/accounts';
import { createPimlicoClient } from 'permissionless/clients/pimlico';

/**
 * Transaction type for Safe UserOps
 */
export interface SafeTransaction {
  to: Address;
  data: Hex;
  value?: bigint;
}

export interface TransactionsToSafeUserOpParams {
  safeAddress: Address;
  permittedAddress: Address;
  transactions: SafeTransaction[];
  chain: Chain;
  safeRpcUrl: string;
  pimlicoRpcUrl: string;
}

export interface SendPermittedSafeUserOperationParams {
  signedUserOp: Record<string, unknown>;
  chain: Chain;
  pimlicoRpcUrl: string;
}

const safeVersion = '1.4.1';
const entryPoint = {
  address: entryPoint07Address,
  version: '0.7',
} as const;

/**
 * Create a dummy account for the PKP address.
 * Returns dummy signatures for estimation/building.
 */
function addressToAccount(address: Address) {
  return toAccount({
    address,
    async signMessage() {
      return ('0x' + '00'.repeat(65)) as Hex;
    },
    async signTypedData() {
      return ('0x' + '00'.repeat(65)) as Hex;
    },
    async signTransaction() {
      return ('0x' + '00'.repeat(65)) as Hex;
    },
  });
}

/**
 * Create a Safe UserOp from transactions.
 * Returns the unsigned UserOp that needs to be signed by the Vincent ability.
 */
export async function transactionsToSafeUserOp({
  safeAddress,
  permittedAddress,
  transactions,
  chain,
  safeRpcUrl,
  pimlicoRpcUrl,
}: TransactionsToSafeUserOpParams) {
  const safeTransport = http(safeRpcUrl);
  const pimlicoTransport = http(pimlicoRpcUrl);

  const publicClient = createPublicClient({
    chain,
    transport: safeTransport,
  });

  const pimlicoClient = createPimlicoClient({
    entryPoint,
    transport: pimlicoTransport,
  });

  // Create a dummy signer for the PKP address
  const dummySigner = addressToAccount(permittedAddress);

  // We re-instantiate the account using the Safe address and the dummy PKP as the signer
  const safeAccount = await toSafeSmartAccount({
    entryPoint,
    address: safeAddress,
    client: publicClient,
    owners: [dummySigner],
    version: safeVersion,
  });

  const safeClient = createSmartAccountClient({
    chain,
    account: safeAccount,
    bundlerTransport: pimlicoTransport,
    client: publicClient,
    paymaster: pimlicoClient,
  });

  const calls = transactions.map((tx) => ({
    data: tx.data,
    to: tx.to,
    value: tx.value,
  }));

  const userOp = await safeClient.prepareUserOperation({
    calls,
    account: safeAccount,
  });

  console.log('[transactionsToSafeUserOp] Prepared unsigned userOp');

  return userOp;
}

/**
 * Send a signed Safe UserOp to the bundler.
 * Returns the transaction hash.
 */
export async function sendPermittedSafeUserOperation({
  signedUserOp,
  chain,
  pimlicoRpcUrl,
}: SendPermittedSafeUserOperationParams): Promise<Hex> {
  const pimlicoTransport = http(pimlicoRpcUrl);

  const bundlerClient = createBundlerClient({
    chain,
    transport: pimlicoTransport,
  });

  console.log('[sendPermittedSafeUserOperation] Broadcasting user op to the network...');

  const userOpHash = await bundlerClient.sendUserOperation(signedUserOp as any);
  console.log('[sendPermittedSafeUserOperation] UserOp hash:', userOpHash);

  const receipt = await bundlerClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  const txHash = receipt.receipt.transactionHash;
  console.log('[sendPermittedSafeUserOperation] Transaction hash:', txHash);

  return txHash;
}
