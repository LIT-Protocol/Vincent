import { Contract, Signer } from 'ethers';
import { VINCENT_DIAMOND_CONTRACT_ADDRESS, COMBINED_ABI } from './constants';

/**
 * Creates an Ethers Contract instance with the provided signer. For internal use only.
 * @param signer - The ethers signer to use for transactions. Could be a standard Ethers Signer or a PKPEthersWallet
 * @returns Contract instance to be used internally for calling Vincent Contracts functions
 */
export function createContract(signer: Signer): Contract {
  return new Contract(VINCENT_DIAMOND_CONTRACT_ADDRESS, COMBINED_ABI, signer);
}

/**
 * Finds an event by name from transaction logs. Used for mutate contract functions to return the result of the transaction. For internal use only.
 * @param contract - The internal-use only contract instance
 * @param logs - Array of transaction logs from the tx.wait()
 * @param eventName - Name of the event to find
 * @returns The parsed event log or null if not found. To be used for error handling
 */
export function findEventByName(contract: Contract, logs: any[], eventName: string): any {
  return logs.find((log: any) => {
    try {
      const parsed = contract.interface.parseLog(log);
      return parsed?.name === eventName;
    } catch {
      return false;
    }
  });
}

export function decodeContractError(error: any, contract: Contract): string {
  console.error('Decoding contract error:', error);
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
        } catch (parseError) {
          // Ignore JSON parse errors
        }
      }

      // Try to decode the error data if we have it
      if (errorData) {
        try {
          const decodedError = contract.interface.parseError(errorData);
          if (decodedError) {
            // Format the arguments nicely
            const formattedArgs = decodedError.args.map((arg: any) => {
              if (typeof arg === 'bigint') {
                return arg.toString();
              }
              return arg;
            });
            return `Contract Error: ${decodedError.name} - ${JSON.stringify(formattedArgs)}`;
          }
        } catch (decodeError) {
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
          const formattedArgs = decodedError.args.map((arg: any) => {
            if (typeof arg === 'bigint') {
              return arg.toString();
            }
            return arg;
          });
          return `Transaction Error: ${decodedError.name} - ${JSON.stringify(formattedArgs)}`;
        }
      } catch (decodeError) {
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
        } catch (parseError) {
          // Ignore JSON parse errors
        }
      }

      if (errorData) {
        try {
          const decodedError = contract.interface.parseError(errorData);
          if (decodedError) {
            const formattedArgs = decodedError.args.map((arg: any) => {
              if (typeof arg === 'bigint') {
                return arg.toString();
              }
              return arg;
            });
            return `Gas Estimation Error: ${decodedError.name} - ${JSON.stringify(formattedArgs)}`;
          }
        } catch (decodeError) {
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
  } catch (decodeError) {
    return error.message || 'Unknown error';
  }
}
