import type { BigNumber } from 'ethers';

import type {
  RegisterAppOptions,
  RegisterNextVersionOptions,
  EnableAppVersionOptions,
  AddDelegateeOptions,
  RemoveDelegateeOptions,
  DeleteAppOptions,
  UndeleteAppOptions,
} from '../types/App';

import {
  decodeContractError,
  createContract,
  findEventByName,
  gasAdjustedOverrides,
} from '../utils';

/**
 * Register a new app version
 *
 * @param params
 * @param params.signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param params.args - Object containing appId, delegatees, and versionTools
 * @param params.overrides - Optional ethers.Override params for the transaction call (like manual gas limit)
 *
 * @returns The transaction hash

 */
export async function registerApp(params: RegisterAppOptions): Promise<{ txHash: string }> {
  const {
    signer,
    args: { appId, delegateeAddresses, versionTools },
    overrides,
  } = params;

  const contract = createContract(signer);

  try {
    const adjustedOverrides = await gasAdjustedOverrides(
      contract,
      'registerApp',
      [appId, delegateeAddresses, versionTools],
      overrides,
    );

    const tx = await contract.registerApp(appId, delegateeAddresses, versionTools, {
      ...adjustedOverrides,
    });

    await tx.wait();

    return {
      txHash: tx.hash,
    };
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Register App: ${decodedError}`);
  }
}

/**
 * Register a new version of an existing application
 * @param params
 * @param params.signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param params.args - Object containing appId and versionTools
 * @param params.overrides - Optional ethers.Override params for the transaction call (like manual gas limit)
 * @returns The transaction hash and the new app version incremented on-chain. If for some reason the event is not found after a successful transaction, this method will throw an error.

 */
export async function registerNextVersion(
  params: RegisterNextVersionOptions,
): Promise<{ txHash: string; newAppVersion: number }> {
  const {
    signer,
    args: { appId, versionTools },
    overrides,
  } = params;
  const contract = createContract(signer);

  try {
    const adjustedOverrides = await gasAdjustedOverrides(
      contract,
      'registerNextAppVersion',
      [appId, versionTools],
      overrides,
    );

    const tx = await contract.registerNextAppVersion(appId, versionTools, {
      ...adjustedOverrides,
    });
    const receipt = await tx.wait();

    const event = findEventByName(contract, receipt.logs, 'NewAppVersionRegistered');

    if (!event) {
      throw new Error('NewAppVersionRegistered event not found');
    }

    const newAppVersion: BigNumber | undefined =
      contract.interface.parseLog(event)?.args?.appVersion;

    if (!newAppVersion) {
      throw new Error('NewAppVersionRegistered event does not contain appVersion argument');
    }

    return {
      txHash: tx.hash,
      newAppVersion: newAppVersion.toNumber(),
    };
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Register Next Version: ${decodedError}`);
  }
}

/**
 * Enable or disable a specific app version
 * @param params
 * @param params.signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param params.args - Object containing appId, appVersion, and enabled flag state to set
 * @param params.overrides - Optional ethers.Override params for the transaction call (like manual gas limit)
 * @returns The transaction hash

 */
export async function enableAppVersion(
  params: EnableAppVersionOptions,
): Promise<{ txHash: string }> {
  const {
    signer,
    args: { appId, appVersion, enabled },
    overrides,
  } = params;
  const contract = createContract(signer);

  try {
    const adjustedOverrides = await gasAdjustedOverrides(
      contract,
      'enableAppVersion',
      [appId, appVersion, enabled],
      overrides,
    );

    const tx = await contract.enableAppVersion(appId, appVersion, enabled, {
      ...adjustedOverrides,
    });
    await tx.wait();

    return {
      txHash: tx.hash,
    };
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Enable App Version: ${decodedError}`);
  }
}

/**
 * Add a new delegatee to an app
 * @param params
 * @param params.signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param params.args - Object containing appId and delegatee address
 * @param params.overrides - Optional ethers.Override params for the transaction call (like manual gas limit)
 * @returns The transaction hash

 */
export async function addDelegatee(params: AddDelegateeOptions): Promise<{ txHash: string }> {
  const {
    signer,
    args: { appId, delegateeAddress },
    overrides,
  } = params;
  const contract = createContract(signer);

  try {
    const adjustedOverrides = await gasAdjustedOverrides(
      contract,
      'addDelegatee',
      [appId, delegateeAddress],
      overrides,
    );

    const tx = await contract.addDelegatee(appId, delegateeAddress, {
      ...adjustedOverrides,
    });
    await tx.wait();

    return {
      txHash: tx.hash,
    };
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Add Delegatee: ${decodedError}`);
  }
}

/**
 * Remove a delegatee from an app
 * @param params
 * @param params.signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param params.args - Object containing appId and delegatee address
 * @param params.overrides - Optional ethers.Override params for the transaction call (like manual gas limit)
 * @returns The transaction hash

 */
export async function removeDelegatee(params: RemoveDelegateeOptions): Promise<{ txHash: string }> {
  const {
    signer,
    args: { appId, delegateeAddress },
    overrides,
  } = params;
  const contract = createContract(signer);

  try {
    const adjustedOverrides = await gasAdjustedOverrides(
      contract,
      'removeDelegatee',
      [appId, delegateeAddress],
      overrides,
    );

    const tx = await contract.removeDelegatee(appId, delegateeAddress, {
      ...adjustedOverrides,
    });
    await tx.wait();

    return {
      txHash: tx.hash,
    };
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Remove Delegatee: ${decodedError}`);
  }
}

/**
 * Delete an application by setting its isDeleted flag to true
 *
 * @param params
 * @param params.signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param params.args - Object containing appId
 * @param params.overrides - Optional ethers.Override params for the transaction call (like manual gas limit)
 * @returns The transaction hash and a success flag

 */
export async function deleteApp(params: DeleteAppOptions): Promise<{ txHash: string }> {
  const {
    signer,
    args: { appId },
    overrides,
  } = params;
  const contract = createContract(signer);

  try {
    const adjustedOverrides = await gasAdjustedOverrides(contract, 'deleteApp', [appId], overrides);

    const tx = await contract.deleteApp(appId, {
      ...adjustedOverrides,
    });
    await tx.wait();

    return {
      txHash: tx.hash,
    };
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Delete App: ${decodedError}`);
  }
}

/**
 * Undelete an app by setting its isDeleted flag to false
 * @param params
 * @param params.signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param params.args - Object containing appId
 * @param params.overrides - Optional ethers.Override params for the transaction call (like manual gas limit)
 * @returns The transaction hash and a success flag

 */
export async function undeleteApp(params: UndeleteAppOptions): Promise<{ txHash: string }> {
  const {
    signer,
    args: { appId },
    overrides,
  } = params;
  const contract = createContract(signer);

  try {
    const adjustedOverrides = await gasAdjustedOverrides(
      contract,
      'undeleteApp',
      [appId],
      overrides,
    );

    const tx = await contract.undeleteApp(appId, {
      ...adjustedOverrides,
    });
    await tx.wait();

    return {
      txHash: tx.hash,
    };
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Undelete App: ${decodedError}`);
  }
}
