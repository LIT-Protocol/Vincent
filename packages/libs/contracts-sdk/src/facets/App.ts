import { utils } from 'ethers';
import {
  decodeContractError,
  createContract,
  findEventByName,
  gasAdjustedOverrides,
} from '../utils';
import {
  RegisterAppOptions,
  RegisterNextVersionOptions,
  EnableAppVersionOptions,
  AddDelegateeOptions,
  RemoveDelegateeOptions,
  DeleteAppOptions,
  UndeleteAppOptions,
} from '../types/App';

/**
 * Register a new app version
 * @param signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param args - Object containing appId, delegatees, and versionTools
 * @param overrides - Optional override params for the transaction call like manual gas limit
 * @returns The transaction hash and the new app version incremented on-chain. If for some reason the event is not found after a successful transaction, it will return -1.
 */
export async function registerApp({
  signer,
  args,
  overrides,
}: RegisterAppOptions): Promise<{ txHash: string; newAppVersion: string }> {
  const contract = createContract(signer);

  try {
    const appId = utils.parseUnits(args.appId, 0);

    const adjustedOverrides = await gasAdjustedOverrides(
      contract,
      'registerApp',
      [appId, args.delegatees, args.versionTools],
      overrides,
    );
    console.log('adjustedOverrides: ', adjustedOverrides);

    const tx = await contract.registerApp(appId, args.delegatees, args.versionTools, {
      ...adjustedOverrides,
    });
    const receipt = await tx.wait();

    const event = findEventByName(contract, receipt.logs, 'NewAppVersionRegistered');
    const newAppVersion = event
      ? contract.interface.parseLog(event)?.args.appVersion.toString() || '-1'
      : '-1';

    return {
      txHash: tx.hash,
      newAppVersion,
    };
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Register App: ${decodedError}`);
  }
}

/**
 * Register a new version of an existing application
 * @param signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param args - Object containing appId and versionTools
 * @param overrides - Optional override params for the transaction call like manual gas limit
 * @returns The transaction hash and the new app version incremented on-chain. If for some reason the event is not found after a successful transaction, it will return -1.
 */
export async function registerNextVersion({
  signer,
  args,
  overrides,
}: RegisterNextVersionOptions): Promise<{ txHash: string; newAppVersion: string }> {
  const contract = createContract(signer);

  try {
    const appId = utils.parseUnits(args.appId, 0);

    const adjustedOverrides = await gasAdjustedOverrides(
      contract,
      'registerNextAppVersion',
      [appId, args.versionTools],
      overrides,
    );

    const tx = await contract.registerNextAppVersion(appId, args.versionTools, {
      ...adjustedOverrides,
    });
    const receipt = await tx.wait();

    const event = findEventByName(contract, receipt.logs, 'NewAppVersionRegistered');
    const newAppVersion = event
      ? contract.interface.parseLog(event)?.args.appVersion.toString() || '-1'
      : '-1';

    return {
      txHash: tx.hash,
      newAppVersion,
    };
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Register Next Version: ${decodedError}`);
  }
}

/**
 * Enable or disable a specific app version
 * @param signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param args - Object containing appId, appVersion, and enabled flag
 * @param overrides - Optional override params for the transaction call like manual gas limit
 * @returns The transaction hash and a success flag
 */
export async function enableAppVersion({
  signer,
  args,
  overrides,
}: EnableAppVersionOptions): Promise<{ txHash: string; success: boolean }> {
  const contract = createContract(signer);

  try {
    const appId = utils.parseUnits(args.appId, 0);
    const appVersion = utils.parseUnits(args.appVersion, 0);

    const adjustedOverrides = await gasAdjustedOverrides(
      contract,
      'enableAppVersion',
      [appId, appVersion, args.enabled],
      overrides,
    );

    const tx = await contract.enableAppVersion(appId, appVersion, args.enabled, {
      ...adjustedOverrides,
    });
    await tx.wait();

    return {
      txHash: tx.hash,
      success: true,
    };
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Enable App Version: ${decodedError}`);
  }
}

/**
 * Add a new delegatee to an app
 * @param signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param args - Object containing appId and delegatee address
 * @param overrides - Optional override params for the transaction call like manual gas limit
 * @returns The transaction hash and a success flag
 */
export async function addDelegatee({
  signer,
  args,
  overrides,
}: AddDelegateeOptions): Promise<{ txHash: string; success: boolean }> {
  const contract = createContract(signer);

  try {
    const appId = utils.parseUnits(args.appId, 0);

    const adjustedOverrides = await gasAdjustedOverrides(
      contract,
      'addDelegatee',
      [appId, args.delegatee],
      overrides,
    );

    const tx = await contract.addDelegatee(appId, args.delegatee, {
      ...adjustedOverrides,
    });
    await tx.wait();

    return {
      txHash: tx.hash,
      success: true,
    };
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Add Delegatee: ${decodedError}`);
  }
}

/**
 * Remove a delegatee from an app
 * @param signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param args - Object containing appId and delegatee address
 * @param overrides - Optional override params for the transaction call like manual gas limit
 * @returns The transaction hash and a success flag
 */
export async function removeDelegatee({
  signer,
  args,
  overrides,
}: RemoveDelegateeOptions): Promise<{ txHash: string; success: boolean }> {
  const contract = createContract(signer);

  try {
    const appId = utils.parseUnits(args.appId, 0);

    const adjustedOverrides = await gasAdjustedOverrides(
      contract,
      'removeDelegatee',
      [appId, args.delegatee],
      overrides,
    );

    const tx = await contract.removeDelegatee(appId, args.delegatee, {
      ...adjustedOverrides,
    });
    await tx.wait();

    return {
      txHash: tx.hash,
      success: true,
    };
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Remove Delegatee: ${decodedError}`);
  }
}

/**
 * Delete an application by setting its isDeleted flag to true
 * @param signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param args - Object containing appId
 * @param overrides - Optional override params for the transaction call like manual gas limit
 * @returns The transaction hash and a success flag
 */
export async function deleteApp({
  signer,
  args,
  overrides,
}: DeleteAppOptions): Promise<{ txHash: string; success: boolean }> {
  const contract = createContract(signer);

  try {
    const appId = utils.parseUnits(args.appId, 0);

    const adjustedOverrides = await gasAdjustedOverrides(contract, 'deleteApp', [appId], overrides);

    const tx = await contract.deleteApp(appId, {
      ...adjustedOverrides,
    });
    await tx.wait();

    return {
      txHash: tx.hash,
      success: true,
    };
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Delete App: ${decodedError}`);
  }
}

/**
 * Undelete an app by setting its isDeleted flag to false
 * @param signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param args - Object containing appId
 * @param overrides - Optional override params for the transaction call like manual gas limit
 * @returns The transaction hash and a success flag
 */
export async function undeleteApp({
  signer,
  args,
  overrides,
}: UndeleteAppOptions): Promise<{ txHash: string; success: boolean }> {
  const contract = createContract(signer);

  try {
    const appId = utils.parseUnits(args.appId, 0);

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
      success: true,
    };
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Undelete App: ${decodedError}`);
  }
}
