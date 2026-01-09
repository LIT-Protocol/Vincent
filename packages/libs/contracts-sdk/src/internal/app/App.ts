import type {
  RegisterAppOptions,
  RegisterNextVersionOptions,
  EnableAppVersionOptions,
  AddDelegateeOptions,
  RemoveDelegateeOptions,
  SetDelegateeOptions,
  DeleteAppOptions,
  UndeleteAppOptions,
} from './types.ts';

import { decodeContractError, findEventByName, gasAdjustedOverrides } from '../../utils';

export async function registerApp(
  params: RegisterAppOptions,
): Promise<{ txHash: string; newAppId: number }> {
  const {
    contract,
    args: { delegateeAddresses, versionAbilities },
    overrides,
  } = params;

  try {
    const adjustedOverrides = await gasAdjustedOverrides(
      contract,
      'registerApp',
      [delegateeAddresses, versionAbilities],
      overrides,
    );

    const tx = await contract.registerApp(delegateeAddresses, versionAbilities, {
      ...adjustedOverrides,
    });

    const receipt = await tx.wait();

    const event = findEventByName(contract, receipt.logs, 'NewAppRegistered');

    if (!event) {
      throw new Error('NewAppRegistered event not found');
    }

    const newAppId: number | undefined = contract.interface.parseLog(event)?.args?.appId;

    if (newAppId === undefined) {
      throw new Error('NewAppRegistered event does not contain appId argument');
    }

    return {
      txHash: tx.hash,
      newAppId: Number(newAppId),
    };
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Register App: ${decodedError}`);
  }
}

export async function registerNextVersion(
  params: RegisterNextVersionOptions,
): Promise<{ txHash: string; newAppVersion: number }> {
  const {
    contract,
    args: { appId, versionAbilities },
    overrides,
  } = params;

  try {
    const adjustedOverrides = await gasAdjustedOverrides(
      contract,
      'registerNextAppVersion',
      [appId, versionAbilities],
      overrides,
    );

    const tx = await contract.registerNextAppVersion(appId, versionAbilities, {
      ...adjustedOverrides,
    });
    const receipt = await tx.wait();

    const event = findEventByName(contract, receipt.logs, 'NewAppVersionRegistered');

    if (!event) {
      throw new Error('NewAppVersionRegistered event not found');
    }

    const newAppVersion: number | undefined = contract.interface.parseLog(event)?.args?.appVersion;

    if (!newAppVersion) {
      throw new Error('NewAppVersionRegistered event does not contain appVersion argument');
    }

    return {
      txHash: tx.hash,
      newAppVersion,
    };
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Register Next Version: ${decodedError}`);
  }
}

export async function enableAppVersion(
  params: EnableAppVersionOptions,
): Promise<{ txHash: string }> {
  const {
    contract,
    args: { appId, appVersion, enabled },
    overrides,
  } = params;

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

export async function addDelegatee(params: AddDelegateeOptions): Promise<{ txHash: string }> {
  const {
    contract,
    args: { appId, delegateeAddress },
    overrides,
  } = params;

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

export async function removeDelegatee(params: RemoveDelegateeOptions): Promise<{ txHash: string }> {
  const {
    contract,
    args: { appId, delegateeAddress },
    overrides,
  } = params;

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

export async function setDelegatee(params: SetDelegateeOptions): Promise<{ txHash: string }> {
  const {
    contract,
    args: { appId, delegateeAddresses },
    overrides,
  } = params;

  try {
    const adjustedOverrides = await gasAdjustedOverrides(
      contract,
      'setDelegatee',
      [appId, delegateeAddresses],
      overrides,
    );

    const tx = await contract.setDelegatee(appId, delegateeAddresses, {
      ...adjustedOverrides,
    });
    await tx.wait();

    return {
      txHash: tx.hash,
    };
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Set Delegatee: ${decodedError}`);
  }
}

export async function deleteApp(params: DeleteAppOptions): Promise<{ txHash: string }> {
  const {
    contract,
    args: { appId },
    overrides,
  } = params;

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

export async function undeleteApp(params: UndeleteAppOptions): Promise<{ txHash: string }> {
  const {
    contract,
    args: { appId },
    overrides,
  } = params;

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
