import { utils } from 'ethers';
import { decodeContractError, createContract } from '../utils';
import {
  GetAppByIdOptions,
  App,
  GetAppVersionOptions,
  AppVersion,
  GetAppsByManagerOptions,
  GetAppByDelegateeOptions,
  GetDelegatedAgentPkpTokenIdsOptions,
} from '../types/App';

/**
 * Get detailed information about an app by its ID
 * @param signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param args - Object containing appId
 * @returns Detailed view of the app containing its metadata and relationships
 */
export async function getAppById({ signer, args }: GetAppByIdOptions): Promise<App> {
  const contract = createContract(signer);

  try {
    const appId = utils.parseUnits(args.appId, 0);

    const app = await contract.getAppById(appId);

    return {
      id: app.id.toString(),
      isDeleted: app.isDeleted,
      manager: app.manager,
      latestVersion: app.latestVersion.toString(),
      delegatees: app.delegatees,
    };
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Get App By ID: ${decodedError}`);
  }
}

/**
 * Get detailed information about a specific version of an app
 * @param signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param args - Object containing appId and version
 * @returns Version-specific information including tools and policies
 */
export async function getAppVersion({ signer, args }: GetAppVersionOptions): Promise<AppVersion> {
  const contract = createContract(signer);

  try {
    const appId = utils.parseUnits(args.appId, 0);
    const version = utils.parseUnits(args.version, 0);

    const appVersion = await contract.getAppVersion(appId, version);

    const convertedAppVersion: AppVersion = {
      version: appVersion.version.toString(),
      enabled: appVersion.enabled,
      tools: appVersion.tools.map((tool: any) => ({
        toolIpfsCid: tool.toolIpfsCid,
        policyIpfsCids: tool.policyIpfsCids,
      })),
    };

    return convertedAppVersion;
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Get App Version: ${decodedError}`);
  }
}

/**
 * Get all apps managed by a specific address with all their versions
 * @param signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param args - Object containing manager address, offset, and limit
 * @returns Array of apps with all their versions managed by the specified address
 */
export async function getAppsByManager({
  signer,
  args,
}: GetAppsByManagerOptions): Promise<{ id: string; versionCount: string }[]> {
  const contract = createContract(signer);

  try {
    const offset = utils.parseUnits(args.offset, 0);

    const [appIds, appVersionCounts] = await contract.getAppsByManager(args.manager, offset);

    return appIds.map((id: any, idx: number) => ({
      id: id.toString(),
      versionCount: appVersionCounts[idx].toString(),
    }));
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Get Apps By Manager: ${decodedError}`);
  }
}

/**
 * Get the app associated with a delegatee address
 * @param signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param args - Object containing delegatee address
 * @returns Detailed view of the app the delegatee is associated with
 */
export async function getAppByDelegatee({ signer, args }: GetAppByDelegateeOptions): Promise<App> {
  const contract = createContract(signer);

  try {
    const app = await contract.getAppByDelegatee(args.delegatee);

    return {
      id: app.id.toString(),
      isDeleted: app.isDeleted,
      manager: app.manager,
      latestVersion: app.latestVersion.toString(),
      delegatees: app.delegatees,
    };
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Get App By Delegatee: ${decodedError}`);
  }
}

/**
 * Get the app ID associated with a delegatee address
 * @param signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param args - Object containing delegatee address
 * @returns The app ID if the delegatee is registered, null otherwise
 */
export async function getAppIdByDelegatee({
  signer,
  args,
}: GetAppByDelegateeOptions): Promise<string | null> {
  try {
    const app = await getAppByDelegatee({ signer, args });
    return app.id;
  } catch (error: unknown) {
    const decodedError = error instanceof Error ? error.message : String(error);

    if (decodedError.includes('DelegateeNotRegistered')) {
      return null;
    }

    throw new Error(`Failed to Get App ID By Delegatee: ${decodedError}`);
  }
}

/**
 * Get delegated agent PKP token IDs for a specific app version with pagination
 * @param signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param args - Object containing appId, version, offset, and limit
 * @returns Array of delegated agent PKP token IDs
 */
export async function getDelegatedAgentPkpTokenIds({
  signer,
  args,
}: GetDelegatedAgentPkpTokenIdsOptions): Promise<string[]> {
  const contract = createContract(signer);

  try {
    const appId = utils.parseUnits(args.appId, 0);
    const version = utils.parseUnits(args.version, 0);
    const offset = utils.parseUnits(args.offset, 0);

    const delegatedAgentPkpTokenIds = await contract.getDelegatedAgentPkpTokenIds(
      appId,
      version,
      offset,
    );

    return delegatedAgentPkpTokenIds.map((id: any) => id.toString());
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Get Delegated Agent PKP Token IDs: ${decodedError}`);
  }
}
