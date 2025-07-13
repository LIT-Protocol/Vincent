import { utils } from 'ethers';
import { decodeContractError, createContract } from '../utils';
import {
  GetAppByIdOptions,
  App,
  GetAppVersionOptions,
  AppVersion,
  GetAppsByManagerOptions,
  AppWithVersions,
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
 * @returns Object containing basic app information and version-specific information including tools and policies
 */
export async function getAppVersion({
  signer,
  args,
}: GetAppVersionOptions): Promise<{ app: App; appVersion: AppVersion }> {
  const contract = createContract(signer);

  try {
    const appId = utils.parseUnits(args.appId, 0);
    const version = utils.parseUnits(args.version, 0);

    const [app, appVersion] = await contract.getAppVersion(appId, version);

    const convertedApp: App = {
      id: app.id.toString(),
      isDeleted: app.isDeleted,
      manager: app.manager,
      latestVersion: app.latestVersion.toString(),
      delegatees: app.delegatees,
    };

    const convertedAppVersion: AppVersion = {
      version: appVersion.version.toString(),
      enabled: appVersion.enabled,
      delegatedAgentPkpTokenIds: appVersion.delegatedAgentPkpTokenIds.map((id: any) =>
        id.toString(),
      ),
      tools: appVersion.tools.map((tool: any) => ({
        toolIpfsCid: tool.toolIpfsCid,
        policyIpfsCids: tool.policyIpfsCids,
      })),
    };

    return {
      app: convertedApp,
      appVersion: convertedAppVersion,
    };
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Get App Version: ${decodedError}`);
  }
}

/**
 * Get all apps managed by a specific address with all their versions
 * @param signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param args - Object containing manager address
 * @returns Array of apps with all their versions managed by the specified address
 */
export async function getAppsByManager({
  signer,
  args,
}: GetAppsByManagerOptions): Promise<AppWithVersions[]> {
  const contract = createContract(signer);

  try {
    const appsWithVersions = await contract.getAppsByManager(args.manager);

    return appsWithVersions.map((appWithVersions: any) => ({
      app: {
        id: appWithVersions.app.id.toString(),
        isDeleted: appWithVersions.app.isDeleted,
        manager: appWithVersions.app.manager,
        latestVersion: appWithVersions.app.latestVersion.toString(),
        delegatees: appWithVersions.app.delegatees,
      },
      versions: appWithVersions.versions.map((version: any) => ({
        version: version.version.toString(),
        enabled: version.enabled,
        delegatedAgentPkpTokenIds: version.delegatedAgentPkpTokenIds.map((id: any) =>
          id.toString(),
        ),
        tools: version.tools.map((tool: any) => ({
          toolIpfsCid: tool.toolIpfsCid,
          policyIpfsCids: tool.policyIpfsCids,
        })),
      })),
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
    const limit = utils.parseUnits(args.limit, 0);

    const delegatedAgentPkpTokenIds = await contract.getDelegatedAgentPkpTokenIds(
      appId,
      version,
      offset,
      limit,
    );

    return delegatedAgentPkpTokenIds.map((id: any) => id.toString());
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Get Delegated Agent PKP Token IDs: ${decodedError}`);
  }
}
