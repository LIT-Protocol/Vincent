import { LIT_NETWORK, RPC_URL_BY_NETWORK } from '@lit-protocol/constants';
import { ethers } from 'ethers';

// Human readable ABI with error definitions for better error parsing
const VINCENT_USER_VIEW_CONTRACT_ABI = [
  'function validateToolExecutionAndGetPolicies(address delegatee, uint256 pkpTokenId, string toolIpfsCid) view returns (tuple(bool isPermitted, uint256 appId, uint256 appVersion, tuple(string policyIpfsCid, tuple(string name, uint8 paramType, bytes value)[] parameters)[] policies) validation)',

  // Errors
  'error AppHasBeenDeleted(uint256 appId)',
  'error AppNotRegistered(uint256 appId)',
  'error AppVersionNotRegistered(uint256 appId, uint256 appVersion)',
  'error DelegateeNotAssociatedWithApp(address delegatee)',
  'error EmptyToolIpfsCid()',
  'error InvalidAppId()',
  'error InvalidPkpTokenId()',
  'error NoRegisteredPkpsFound(address userAddress)',
  'error PkpNotPermittedForAppVersion(uint256 pkpTokenId, uint256 appId, uint256 appVersion)',
  'error PolicyParameterNotSetForPkp(uint256 pkpTokenId, uint256 appId, uint256 appVersion, string policyIpfsCid, string parameterName)',
  'error ZeroAddressNotAllowed()',
];

export interface PolicyParameter {
  name: string;
  paramType: number;
  value: string;
}

export interface PolicyInfo {
  policyIpfsCid: string;
  parameters: PolicyParameter[];
}

export interface ToolExecutionValidationResult {
  delegateeIsPermitted: boolean;
  permittedAppId: number;
  permittedAppVersion: number;
  permittedPolicies: PolicyInfo[];
}

export const checkToolExecutionAndGetPolicies = async ({
  vincentContractAddress,
  delegateeAddress,
  pkpTokenId,
  toolIpfsCid,
}: {
  vincentContractAddress: string;
  delegateeAddress: string;
  pkpTokenId: ethers.BigNumber;
  toolIpfsCid: string;
}): Promise<ToolExecutionValidationResult> => {
  const vincentContract = new ethers.Contract(
    vincentContractAddress,
    VINCENT_USER_VIEW_CONTRACT_ABI,
    new ethers.providers.StaticJsonRpcProvider(RPC_URL_BY_NETWORK[LIT_NETWORK.Datil]),
  );

  try {
    const result = await vincentContract.validateToolExecutionAndGetPolicies(
      delegateeAddress,
      pkpTokenId,
      toolIpfsCid,
    );

    // Handle the result structure - the full ABI returns a tuple named "validation"
    const validation = result.validation || result;

    return {
      delegateeIsPermitted: validation.isPermitted,
      permittedAppId: validation.appId.toNumber(),
      permittedAppVersion: validation.appVersion.toNumber(),
      permittedPolicies: validation.policies.map((policy: any) => ({
        policyIpfsCid: policy.policyIpfsCid,
        parameters: policy.parameters.map((param: any) => ({
          name: param.name,
          paramType: param.paramType,
          value: param.value,
        })),
      })),
    };
  } catch (error: any) {
    // Enhanced error handling with custom error parsing
    if (error.code === 'CALL_EXCEPTION' && error.data) {
      try {
        // Try to decode the error using the contract interface
        const contractInterface = new ethers.utils.Interface(VINCENT_USER_VIEW_CONTRACT_ABI);
        const decodedError = contractInterface.parseError(error.data);

        console.error(`❌ Vincent Contract Error: ${decodedError.name}`);
        if (decodedError.args.length > 0) {
          console.error(
            '   Error arguments:',
            decodedError.args.map((arg, i) => `${i}: ${arg}`).join(', '),
          );
        }

        // Create a more descriptive error message based on the error type
        let errorMessage = `Vincent contract validation failed: ${decodedError.name}`;

        switch (decodedError.name) {
          case 'InvalidPkpTokenId':
            errorMessage += ' - The provided PKP token ID is invalid';
            break;
          case 'DelegateeNotAssociatedWithApp':
            errorMessage += ` - Delegatee ${decodedError.args[0]} is not associated with any Vincent app`;
            break;
          case 'AppNotRegistered':
            errorMessage += ` - App ID ${decodedError.args[0]} is not registered`;
            break;
          case 'AppVersionNotRegistered':
            errorMessage += ` - App version ${decodedError.args[1]} for app ID ${decodedError.args[0]} is not registered`;
            break;
          case 'PkpNotPermittedForAppVersion':
            errorMessage += ` - PKP ${decodedError.args[0]} is not permitted for app ${decodedError.args[1]} version ${decodedError.args[2]}`;
            break;
          case 'EmptyToolIpfsCid':
            errorMessage += ' - Tool IPFS CID cannot be empty';
            break;
          case 'ZeroAddressNotAllowed':
            errorMessage += ' - Zero address is not allowed';
            break;
        }

        const enhancedError = new Error(errorMessage);
        (enhancedError as any).originalError = error;
        (enhancedError as any).contractError = decodedError;
        throw enhancedError;
      } catch (parseError) {
        console.error('Failed to parse contract error:', parseError);
        // Fall back to original error
        throw error;
      }
    }
    throw error;
  }
};
