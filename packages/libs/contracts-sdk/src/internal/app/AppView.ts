import type { BigNumber } from 'ethers';

import type { App, AppVersion, AppWithVersions } from '../../types';
import type { AppChain, AppVersionChain, AppWithVersionsChain } from '../types/chain';
import type {
  GetAppByDelegateeOptions,
  GetAppByIdOptions,
  GetAppsByManagerOptions,
  GetAppVersionOptions,
  GetDelegatedPkpEthAddressesOptions,
} from './types.ts';

import { DEFAULT_PAGE_SIZE } from '../../constants';
import { decodeContractError } from '../../utils';
import { getPkpEthAddress } from '../../utils/pkpInfo';

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
      id: app.id.toNumber(),
      latestVersion: app.latestVersion.toNumber(),
      delegateeAddresses: delegatees,
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

export async function getAppVersion(
  params: GetAppVersionOptions,
): Promise<{ appVersion: AppVersion } | null> {
  const {
    args: { appId, version },
    contract,
  } = params;

  try {
    const [, appVersion]: [never, AppVersionChain] = await contract.getAppVersion(appId, version);

    return {
      appVersion: { ...appVersion, version: appVersion.version.toNumber() },
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
): Promise<AppWithVersions[]> {
  const {
    args: { managerAddress },
    contract,
  } = params;

  try {
    const appsWithVersions: AppWithVersionsChain[] =
      await contract.getAppsByManager(managerAddress);

    return appsWithVersions.map(({ app: appChain, versions }) => {
      const { delegatees, ...app } = appChain;
      return {
        app: {
          ...app,
          delegateeAddresses: delegatees,
          id: app.id.toNumber(),
          latestVersion: app.latestVersion.toNumber(),
        },
        versions: versions.map(({ enabled, tools, version: appVersion }) => ({
          version: appVersion.toNumber(),
          enabled: enabled,
          tools,
        })),
      };
    });
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
      id: app.id.toNumber(),
      latestVersion: app.latestVersion.toNumber(),
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

export async function getDelegatedPkpEthAddresses(
  params: GetDelegatedPkpEthAddressesOptions,
): Promise<string[]> {
  const {
    args: { appId, pageOpts, version },
    contract,
  } = params;

  try {
    const delegatedAgentPkpTokenIds: BigNumber[] = await contract.getDelegatedAgentPkpTokenIds(
      appId,
      version,
      pageOpts?.offset || 0,
      pageOpts?.limit || DEFAULT_PAGE_SIZE,
    );

    const delegatedAgentPkpEthAddresses: string[] = [];
    for (const tokenId of delegatedAgentPkpTokenIds) {
      // TODO: add paginated fetching to the pkp router contract (or try some concurrency here)
      const ethAddress = await getPkpEthAddress({ tokenId, signer: contract.signer });
      delegatedAgentPkpEthAddresses.push(ethAddress);
    }

    return delegatedAgentPkpEthAddresses;
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Get Delegated Agent PKP Token IDs: ${decodedError}`);
  }
}
