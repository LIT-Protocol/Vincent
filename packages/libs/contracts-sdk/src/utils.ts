import type { Signer, Overrides } from 'ethers';

import { Contract, BigNumber } from 'ethers';

import { COMBINED_ABI, GAS_ADJUSTMENT_PERCENT } from './constants';

/**
 * Creates an Ethers Contract instance with the provided signer. For internal use / local chain dev only
 * @returns Contract instance to be used internally for calling Vincent Contracts functions
 *
 * @internal
 * @category Internal
 */
export function createContract({
  signer,
  contractAddress,
}: {
  signer: Signer;
  contractAddress: string;
}): Contract {
  return new Contract(contractAddress, COMBINED_ABI, signer);
}

/**
 * Finds an event by name from transaction logs. Used for mutate contract functions to return the result of the transaction. For internal use only.
 * @param contract - The internal-use only contract instance
 * @param logs - Array of transaction logs from the tx.wait()
 * @param eventName - Name of the event to find
 * @returns The parsed event log or null if not found. To be used for error handling
 */
export function findEventByName(
  contract: Contract,
  logs: { topics: Array<string>; data: string }[],
  eventName: string,
): { topics: Array<string>; data: string } | undefined {
  return logs.find((log) => {
    try {
      const parsed = contract.interface.parseLog(log);
      return parsed?.name === eventName;
    } catch {
      return false;
    }
  });
}

export async function gasAdjustedOverrides(
  contract: Contract,
  methodName: string,
  args: unknown[],
  overrides: Overrides = {},
) {
  if (!overrides?.gasLimit) {
    const estimatedGas = await contract.estimateGas[methodName](...args, overrides);
    console.log('Auto estimatedGas: ', estimatedGas);

    return {
      ...overrides,
      gasLimit: estimatedGas.mul(GAS_ADJUSTMENT_PERCENT).div(100),
    };
  }

  return overrides;
}

// Ethers v5 returns BN.js instances. Ethers v6 returns native `bigint`.
function isBigNumberOrBigInt(arg: unknown) {
  return typeof arg === 'bigint' || BigNumber.isBigNumber(arg);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function decodeContractError(error: any, contract: Contract): string {
  // console.error('Decoding contract error:', error); // All contract revert errors appear to be logged by ethers :)
  try {
    // Check if it's a contract revert error
    if (error.code === 'CALL_EXCEPTION' || error.code === 'UNPREDICTABLE_GAS_LIMIT') {
      // Try to extract error data from nested error structure
      let errorData = error.data;

      // If no direct data, check nested error structures
      if (!errorData && error.error && error.error.data) {
        errorData = error.error.data;
      }

      // If still no data, check the body for JSON-RPC error
      if (!errorData && error.error && error.error.body) {
        try {
          const body = JSON.parse(error.error.body);
          if (body.error && body.error.data) {
            errorData = body.error.data;
          }
        } catch {
          // Ignore JSON parse errors
        }
      }

      // Try to decode the error data if we have it
      if (errorData) {
        try {
          const decodedError = contract.interface.parseError(errorData);
          if (decodedError) {
            // Format the arguments nicely
            const formattedArgs = decodedError.args.map((arg: unknown) => {
              if (isBigNumberOrBigInt(arg)) {
                return arg.toString();
              }
              return arg;
            });
            return `Contract Error: ${decodedError.name} - ${JSON.stringify(formattedArgs)}`;
          }
        } catch {
          // If we can't decode the specific error, try to get the reason
          if (error.reason) {
            return `Contract Error: ${error.reason}`;
          }
        }
      }

      // If no data but has reason
      if (error.reason) {
        return `Contract Error: ${error.reason}`;
      }
    }

    // Check if it's a transaction revert
    if (error.transaction) {
      try {
        const decodedError = contract.interface.parseError(error.data);
        if (decodedError) {
          const formattedArgs = decodedError.args.map((arg: unknown) => {
            if (isBigNumberOrBigInt(arg)) {
              return arg.toString();
            }
            return arg;
          });
          return `Transaction Error: ${decodedError.name} - ${JSON.stringify(formattedArgs)}`;
        }
      } catch {
        // Fallback to error message
      }
    }

    // Check if it's a gas estimation error
    if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
      // Try to extract error data from the nested error structure
      let errorData = error.data;

      if (!errorData && error.error && error.error.data) {
        errorData = error.error.data;
      }

      if (!errorData && error.error && error.error.body) {
        try {
          const body = JSON.parse(error.error.body);
          if (body.error && body.error.data) {
            errorData = body.error.data;
          }
        } catch {
          // Ignore JSON parse errors
        }
      }

      if (errorData) {
        try {
          const decodedError = contract.interface.parseError(errorData);
          if (decodedError) {
            const formattedArgs = decodedError.args.map((arg: unknown) => {
              if (isBigNumberOrBigInt(arg)) {
                return arg.toString();
              }
              return arg;
            });
            return `Gas Estimation Error: ${decodedError.name} - ${JSON.stringify(formattedArgs)}`;
          }
        } catch {
          return `Gas Estimation Error: ${error.error?.message || error.message}`;
        }
      }

      return `Gas Estimation Error: ${error.error?.message || error.message}`;
    }

    // Try to extract errorArgs if available (like in the example you showed)
    if (error.errorArgs && Array.isArray(error.errorArgs)) {
      return `Contract Error: ${error.errorSignature || 'Unknown'} - ${JSON.stringify(error.errorArgs)}`;
    }

    // Return original error message if we can't decode
    return error.message || 'Unknown contract error';
  } catch {
    return error.message || 'Unknown error';
  }
}
