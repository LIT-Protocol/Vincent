// @ts-nocheck
import {
  createPublicClient,
  createWalletClient,
  getContract,
  http,
  PublicClient,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { VincentNetworkContext } from './NetworkContextManager';

interface CreateVincentContractsOptions {
  publicClient?: PublicClient;
  useDiamondAddress?: boolean;
}

export const createVincentContracts = (
  networkCtx: VincentNetworkContext,
  opts?: CreateVincentContractsOptions,
) => { // ts-expect-error TS7056
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
    throw new Error(
      `Contract data not found for network: ${networkCtx.network}`,
    );
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

  const vincentToolFacetContract = getContract({
    address: useDiamondAddress
      ? networkCtx.chainConfig.diamondAddress
      : contractData.VincentToolFacet.address,
    abi: [
      contractData.VincentToolFacet.methods.approveTools,
      contractData.VincentToolFacet.methods.registerTools,
      contractData.VincentToolFacet.methods.removeToolApprovals,
      contractData.VincentToolFacet.methods.updateApprovedToolsManager,
      ...contractData.VincentToolFacet.events,
      ...contractData.VincentToolFacet.errors,
    ],
    client: { public: publicClient, wallet: walletClient },
  });

  const vincentToolViewFacetContract = getContract({
    address: useDiamondAddress
      ? networkCtx.chainConfig.diamondAddress
      : contractData.VincentToolViewFacet.address,
    abi: [
      contractData.VincentToolViewFacet.methods.getAllApprovedTools,
      contractData.VincentToolViewFacet.methods.getApprovedToolsManager,
      contractData.VincentToolViewFacet.methods.getToolIpfsCidByHash,
      contractData.VincentToolViewFacet.methods.isToolApproved,
      ...contractData.VincentToolViewFacet.events,
      ...contractData.VincentToolViewFacet.errors,
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
      contractData.VincentUserViewFacet.methods
        .validateToolExecutionAndGetPolicies,
      ...contractData.VincentUserViewFacet.events,
      ...contractData.VincentUserViewFacet.errors,
    ],
    client: { public: publicClient, wallet: walletClient },
  });

  // ---------- End of all your contracts ----------
  return {
    vincentAppFacetContract,
    vincentAppViewFacetContract,
    vincentToolFacetContract,
    vincentToolViewFacetContract,
    vincentUserFacetContract,
    vincentUserViewFacetContract,
    publicClient,
    walletClient,
  };
};
