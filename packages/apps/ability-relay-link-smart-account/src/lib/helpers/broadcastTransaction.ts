import { Hex } from 'viem';

export interface BroadcastTransactionParams {
  rpcUrl: string;
  signedTransaction: Hex;
}

export interface BroadcastTransactionResult {
  transactionHash: Hex;
}

/**
 * Broadcast a signed transaction to the blockchain via JSON-RPC
 */
export async function broadcastTransaction({
  rpcUrl,
  signedTransaction,
}: BroadcastTransactionParams): Promise<BroadcastTransactionResult> {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_sendRawTransaction',
      params: [signedTransaction],
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
  }

  const result = (await response.json()) as { result?: string; error?: { message?: string } };

  if (result.error) {
    throw new Error(`RPC error: ${result.error.message || JSON.stringify(result.error)}`);
  }

  if (!result.result) {
    throw new Error('No transaction hash returned from RPC');
  }

  return {
    transactionHash: result.result as Hex,
  };
}

export interface PollCheckEndpointParams {
  checkEndpoint: string;
  maxAttempts?: number;
  intervalMs?: number;
}

/**
 * Poll the Relay.link check endpoint until transaction is confirmed
 */
export async function pollCheckEndpoint({
  checkEndpoint,
  maxAttempts = 60,
  intervalMs = 5000,
}: PollCheckEndpointParams): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(checkEndpoint);

    if (!response.ok) {
      console.warn(`Check endpoint returned ${response.status}, retrying...`);
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
      continue;
    }

    const data = (await response.json()) as { status?: string };
    const status = data.status;

    console.log(`Poll attempt ${attempt + 1}/${maxAttempts}: status = ${status}`);

    if (status === 'success') {
      return; // Success!
    }

    if (status === 'failure' || status === 'refund') {
      throw new Error(`Transaction failed with status: ${status}`);
    }

    // Status is 'waiting' or 'pending', continue polling
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error('Polling timeout: transaction status check exceeded maximum attempts');
}
