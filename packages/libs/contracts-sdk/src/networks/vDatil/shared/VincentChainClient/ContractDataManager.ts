import { createPublicClient, getContract, http, PublicClient } from 'viem';
import { VincentNetworkContext } from './NetworkContextManager';

interface CreateVincentContractsOptions {
  publicClient?: PublicClient;
  useDiamondAddress?: boolean;
}

export const createVincentContracts = (
  networkCtx: VincentNetworkContext,
  opts?: CreateVincentContractsOptions,
): any => {
  // ts-expect-error TS7056 (post-build hacky fix)
  const useDiamondAddress = opts?.useDiamondAddress ?? true;

  // 1. Fallback to env-based private key if user doesn't supply a wagmi walletClient
  const fallbackTransport = http(networkCtx.rpcUrl);

  // 2. Decide which publicClient to use
  const publicClient =
    opts?.publicClient ??
    createPublicClient({
      chain: networkCtx.chainConfig.chain,
      transport: fallbackTransport,
    });

  // 3. Decide which walletClient to use
  const walletClient = networkCtx?.walletClient;
  // 4. Get the contract data
  const contractData = networkCtx.chainConfig.contractData;

  if (!contractData) {
    throw new Error(`Contract data not found for network: ${networkCtx.network}`);
  }

  // ---------- All your contracts ----------
  const vincentAppFacetContract = getContract({
    address: useDiamondAddress
      ? networkCtx.chainConfig.diamondAddress
      : contractData.VincentAppFacet.address,
    abi: [
      contractData.VincentAppFacet.methods.addAuthorizedRedirectUri,
      contractData.VincentAppFacet.methods.addDelegatee,
      contractData.VincentAppFacet.methods.enableAppVersion,
      contractData.VincentAppFacet.methods.registerApp,
      contractData.VincentAppFacet.methods.registerNextAppVersion,
      contractData.VincentAppFacet.methods.removeAuthorizedRedirectUri,
      contractData.VincentAppFacet.methods.removeDelegatee,
      contractData.VincentAppFacet.methods.deleteApp,
      contractData.VincentAppFacet.methods.updateAppDeploymentStatus,
      ...contractData.VincentAppFacet.events,
      ...contractData.VincentAppFacet.errors,
    ],
    client: { public: publicClient, wallet: walletClient },
  });

  const vincentAppViewFacetContract = getContract({
    address: useDiamondAddress
      ? networkCtx.chainConfig.diamondAddress
      : contractData.VincentAppViewFacet.address,
    abi: [
      contractData.VincentAppViewFacet.methods.getAppByDelegatee,
      contractData.VincentAppViewFacet.methods.getAppById,
      contractData.VincentAppViewFacet.methods.getAppVersion,
      contractData.VincentAppViewFacet.methods.getAppsByManager,
      contractData.VincentAppViewFacet.methods.getAuthorizedRedirectUriByHash,
      contractData.VincentAppViewFacet.methods.getAuthorizedRedirectUrisByAppId,
      contractData.VincentAppViewFacet.methods.getTotalAppCount,
      ...contractData.VincentAppViewFacet.events,
      ...contractData.VincentAppViewFacet.errors,
    ],
    client: { public: publicClient, wallet: walletClient },
  });

  const vincentLitActionFacetContract = getContract({
    address: useDiamondAddress
      ? networkCtx.chainConfig.diamondAddress
      : contractData.VincentLitActionFacet.address,
    abi: [
      contractData.VincentLitActionFacet.methods.approveLitActions,
      contractData.VincentLitActionFacet.methods.removeLitActionApprovals,
      contractData.VincentLitActionFacet.methods.updateApprovedLitActionsManager,
      ...contractData.VincentLitActionFacet.events,
      ...contractData.VincentLitActionFacet.errors,
    ],
    client: { public: publicClient, wallet: walletClient },
  });

  const vincentLitActionViewFacetContract = getContract({
    address: useDiamondAddress
      ? networkCtx.chainConfig.diamondAddress
      : contractData.VincentLitActionViewFacet.address,
    abi: [
      contractData.VincentLitActionViewFacet.methods.getAllApprovedLitActions,
      contractData.VincentLitActionViewFacet.methods.getApprovedLitActionsManager,
      contractData.VincentLitActionViewFacet.methods.getLitActionIpfsCidByHash,
      contractData.VincentLitActionViewFacet.methods.isLitActionApproved,
      ...contractData.VincentLitActionViewFacet.events,
      ...contractData.VincentLitActionViewFacet.errors,
    ],
    client: { public: publicClient, wallet: walletClient },
  });

  const vincentUserFacetContract = getContract({
    address: useDiamondAddress
      ? networkCtx.chainConfig.diamondAddress
      : contractData.VincentUserFacet.address,
    abi: [
      contractData.VincentUserFacet.methods.permitAppVersion,
      contractData.VincentUserFacet.methods.removeToolPolicyParameters,
      contractData.VincentUserFacet.methods.setToolPolicyParameters,
      contractData.VincentUserFacet.methods.unPermitAppVersion,
      ...contractData.VincentUserFacet.events,
      ...contractData.VincentUserFacet.errors,
    ],
    client: { public: publicClient, wallet: walletClient },
  });

  const vincentUserViewFacetContract = getContract({
    address: useDiamondAddress
      ? networkCtx.chainConfig.diamondAddress
      : contractData.VincentUserViewFacet.address,
    abi: [
      contractData.VincentUserViewFacet.methods.getAllPermittedAppIdsForPkp,
      contractData.VincentUserViewFacet.methods.getAllRegisteredAgentPkps,
      contractData.VincentUserViewFacet.methods.getAllToolsAndPoliciesForApp,
      contractData.VincentUserViewFacet.methods.getPermittedAppVersionForPkp,
      contractData.VincentUserViewFacet.methods.validateToolExecutionAndGetPolicies,
      ...contractData.VincentUserViewFacet.events,
      ...contractData.VincentUserViewFacet.errors,
    ],
    client: { public: publicClient, wallet: walletClient },
  });

  // ---------- End of all your contracts ----------
  return {
    vincentAppFacetContract,
    vincentAppViewFacetContract,
    vincentLitActionFacetContract,
    vincentLitActionViewFacetContract,
    vincentUserFacetContract,
    vincentUserViewFacetContract,
    publicClient,
    walletClient,
  };
};
