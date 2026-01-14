import type { App, AppVersion } from '../../types';
import type { AppChain, AppVersionChain } from '../types/chain';
import type {
  GetAppByDelegateeOptions,
  GetAppByIdOptions,
  GetAppsByManagerOptions,
  GetAppVersionOptions,
  GetDelegatedAgentAddressesOptions,
} from './types.ts';

import { decodeContractError } from '../../utils';

export async function getAppById(params: GetAppByIdOptions): Promise<App | null> {
  const {
    args: { appId },
    contract,
  } = params;

  try {
    const chainApp: AppChain = await contract.getAppById(appId);

    const { delegatees, ...app } = chainApp;
    return {
      ...app,
      id: app.id,
      latestVersion: app.latestVersion,
      delegateeAddresses: delegatees,
      accountIndexHash: app.accountIndexHash,
    };
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);

    // Check if the error is due to AppNotRegistered
    if (decodedError.includes('AppNotRegistered')) {
      return null;
    }

    throw new Error(`Failed to Get App By ID: ${decodedError}`);
  }
}

export async function getAppIdByDelegatee(
  params: GetAppByDelegateeOptions,
): Promise<number | null> {
  const {
    args: { delegateeAddress },
    contract,
  } = params;

  try {
    const app = await contract.getAppByDelegatee(delegateeAddress);
    return app.id;
  } catch (error: unknown) {
    const decodedError = error instanceof Error ? error.message : String(error);

    if (decodedError.includes('DelegateeNotRegistered')) {
      return null;
    }

    throw new Error(`Failed to Get App ID By Delegatee: ${decodedError}`);
  }
}

export async function getAppVersion(
  params: GetAppVersionOptions,
): Promise<{ appVersion: AppVersion } | null> {
  const {
    args: { appId, version },
    contract,
  } = params;

  try {
    const appVersion: AppVersionChain = await contract.getAppVersion(appId, version);

    const convertedAppVersion: AppVersion = {
      version: appVersion.version,
      accountIndexHash: appVersion.accountIndexHash,
      enabled: appVersion.enabled,
      delegatedAgentAddresses: appVersion.delegatedAgents,
      abilities: appVersion.abilities.map((ability) => ({
        abilityIpfsCid: ability.abilityIpfsCid,
        policyIpfsCids: ability.policyIpfsCids,
      })),
    };

    return {
      appVersion: convertedAppVersion,
    };
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);

    // Check if the error is due to AppVersionNotRegistered
    if (
      decodedError.includes('AppVersionNotRegistered') ||
      decodedError.includes('AppNotRegistered')
    ) {
      return null;
    }

    throw new Error(`Failed to Get App Version: ${decodedError}`);
  }
}

export async function getAppsByManagerAddress(
  params: GetAppsByManagerOptions,
): Promise<{ id: number; versionCount: number }[]> {
  const {
    args: { managerAddress, offset },
    contract,
  } = params;

  try {
    const [appIds, appVersionCounts] = await contract.getAppsByManager(managerAddress, offset);

    return appIds.map((id: number, idx: number) => ({
      id,
      versionCount: appVersionCounts[idx],
    }));
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);

    // Check if the error is due to NoAppsFoundForManager or ZeroAddressNotAllowed
    if (decodedError.includes('NoAppsFoundForManager')) {
      return [];
    }

    throw new Error(`Failed to Get Apps By Manager: ${decodedError}`);
  }
}

export async function getAppByDelegateeAddress(
  params: GetAppByDelegateeOptions,
): Promise<App | null> {
  const {
    args: { delegateeAddress },
    contract,
  } = params;

  try {
    const chainApp: AppChain = await contract.getAppByDelegatee(delegateeAddress);

    const { delegatees, ...app } = chainApp;
    return {
      ...app,
      delegateeAddresses: delegatees,
      id: app.id,
      latestVersion: app.latestVersion,
      accountIndexHash: app.accountIndexHash,
    };
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);

    // Check if the error is due to DelegateeNotRegistered or ZeroAddressNotAllowed
    if (decodedError.includes('DelegateeNotRegistered')) {
      return null;
    }

    throw new Error(`Failed to Get App By Delegatee: ${decodedError}`);
  }
}

export async function getDelegatedAgentAddresses(
  params: GetDelegatedAgentAddressesOptions,
): Promise<string[]> {
  const {
    args: { appId, offset, version },
    contract,
  } = params;

  try {
    const delegatedAgentAddresses: string[] = await contract.getDelegatedAgentAddresses(
      appId,
      version,
      offset,
    );

    return delegatedAgentAddresses;
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Get Delegated Agent Addresses: ${decodedError}`);
  }
}
