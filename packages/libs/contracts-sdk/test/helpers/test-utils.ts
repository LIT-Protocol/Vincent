import { ethers } from 'ethers';

import { COMBINED_ABI } from '../../src/constants';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const WAIT_RETRIES = 8;
const WAIT_DELAY_MS = 1500;

export const requireValue = <T>(value: T | null | undefined, label: string): T => {
  if (value === null || value === undefined) {
    throw new Error(`Missing ${label}.`);
  }
  return value;
};

/**
 * Waits for a condition to be met by repeatedly calling a function and checking its result against a predicate.
 *
 * NOTE:
 * tx.wait() only waits for the transaction to be mined; it doesn’t guarantee your RPC endpoint immediately serves the updated state for subsequent eth_call on that same node.
 *
 * On Base Sepolia we were seeing:
 * - registerApp mined (receipt present), but getAppById or getPermittedAppForAgents still returned empty/old data for a short window.
 * - This is an RPC propagation/indexing lag issue, not a transaction finality issue.
 *
 * waitForValue is a small “read‑after‑write” retry that bridges that gap. It avoids flaky tests caused by the RPC returning stale results even after tx.wait().
 */
export const waitForValue = async <T>(
  fn: () => Promise<T>,
  predicate: (value: T) => boolean,
  {
    retries = WAIT_RETRIES,
    delayMs = WAIT_DELAY_MS,
    label = 'condition',
  }: { retries?: number; delayMs?: number; label?: string } = {},
): Promise<T> => {
  let lastError: unknown;
  let lastValue: T | undefined;

  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      const value = await fn();
      lastValue = value;
      if (predicate(value)) {
        return value;
      }
    } catch (error: unknown) {
      lastError = error;
    }
    await delay(delayMs);
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error(
    `Timed out waiting for ${label}. Last value: ${lastValue === undefined ? 'undefined' : String(lastValue)}`,
  );
};

const formatEventValue = (value: unknown): unknown => {
  if (ethers.BigNumber.isBigNumber(value)) {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return value.map(formatEventValue);
  }
  if (value && typeof value === 'object' && 'toHexString' in value) {
    try {
      return (value as { toHexString: () => string }).toHexString();
    } catch {
      return value;
    }
  }
  return value;
};

const formatEventArgs = (args: ethers.utils.Result): Record<string, unknown> => {
  const formatted: Record<string, unknown> = {};
  Object.keys(args)
    .filter((key) => Number.isNaN(Number(key)))
    .forEach((key) => {
      formatted[key] = formatEventValue(args[key]);
    });
  return formatted;
};

/**
 * Logs Vincent diamond events from a transaction receipt for E2E debugging.
 *
 * Best-effort: parses receipt logs with COMBINED_ABI and prints named args
 * to confirm on-chain writes.
 *
 * @example
 * logTxEvents({ provider, txHash, label: 'registerApp' });
 * // Output:
 * // ℹ️  registerApp event NewAppRegistered { appId: 47, accountIndexHash: '0x...', manager: '0x...' }
 * // ℹ️  registerApp event NewAppVersionRegistered { appId: 47, appVersion: 1, manager: '0x...' }
 * // ℹ️  permitApp event AppVersionPermitted { agentAddress: '0x...', appId: 47, appVersion: 1, ... }
 */
export const logTxEvents = async ({
  provider,
  txHash,
  label,
}: {
  provider: ethers.providers.Provider;
  txHash: string;
  label: string;
}) => {
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) {
    console.warn(`⚠️  ${label}: receipt not found for ${txHash}`);
    return;
  }
  const iface = COMBINED_ABI;
  const parsedLogs = receipt.logs.flatMap((log) => {
    try {
      return [iface.parseLog(log)];
    } catch {
      return [];
    }
  });

  if (parsedLogs.length === 0) {
    console.log(`ℹ️  ${label}: no Vincent events found in receipt ${txHash}`);
    return;
  }

  parsedLogs.forEach((event) => {
    console.log(`ℹ️  ${label} event ${event.name}`, formatEventArgs(event.args));
  });
};
