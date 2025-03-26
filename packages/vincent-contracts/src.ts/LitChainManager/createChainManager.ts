import {
  createVincentNetworkContext,
  ExpectedAccountOrWalletClient,
} from '../networks/vDatil/shared/VincentChainClient/vincentNetworkContext';

// Import all the APIs
import { Anvil } from '../networks/shared/chains/Anvil';
import { ChrnoicleYellowstone } from '../networks/shared/chains/ChrnoicleYellowstone';
import * as VincentAppFacet from '../networks/vDatil/shared/VincentChainClient/apis/rawContractApis/VincentAppFacet';
import * as VincentAppViewFacet from '../networks/vDatil/shared/VincentChainClient/apis/rawContractApis/VincentAppViewFacet';
import * as VincentLitActionFacet from '../networks/vDatil/shared/VincentChainClient/apis/rawContractApis/VincentLitActionFacet';
import * as VincentLitActionViewFacet from '../networks/vDatil/shared/VincentChainClient/apis/rawContractApis/VincentLitActionFacetViewFacet';
import * as VincentUserFacet from '../networks/vDatil/shared/VincentChainClient/apis/rawContractApis/VincentUserFacet';
import * as VincentUserViewFacet from '../networks/vDatil/shared/VincentChainClient/apis/rawContractApis/VincentUserViewFacet';

/**
 * Configuration for creating a Datil Chain Manager
 */
export interface DatilChainManagerConfig {
  /**
   * The account or wallet client to use for transactions
   */
  account: ExpectedAccountOrWalletClient;

  /**
   * The network to connect to
   */
  network: 'datil' | 'datil-test' | 'datil-dev';
}

/**
 * Creates a Datil Chain Manager for interacting with Vincent network APIs
 * @param config Configuration including account and network
 * @returns An object with categorized API methods
 */
export function createDatilChainManager(config: DatilChainManagerConfig) {
  // Create network context based on the provided account and network
  const networkContext = createVincentNetworkContext({
    accountOrWalletClient: config.account,
    network: config.network,
  });

  // Helper to bind the network context to an API function
  const bindContext = <T extends (req: any, ctx: any) => any>(fn: T) => {
    return (req: Parameters<T>[0]): ReturnType<T> => fn(req, networkContext);
  };

  switch (config.network) {
    case 'datil':
    case 'datil-test':
    case 'datil-dev':
      return {
        vincentApi: {
          consentPage: {
            getAppById: bindContext(VincentAppViewFacet.getAppById),
            getAppVersion: bindContext(VincentAppViewFacet.getAppVersion),
            isLitActionApproved: bindContext(
              VincentLitActionViewFacet.isLitActionApproved,
            ),
            permitAppVersion: bindContext(VincentUserFacet.permitAppVersion),
            removeLitActionApprovals: bindContext(
              VincentLitActionFacet.removeLitActionApprovals,
            ),
            setToolPolicyParameters: bindContext(
              VincentUserFacet.setToolPolicyParameters,
            ),
            unPermitAppVersion: bindContext(
              VincentUserFacet.unPermitAppVersion,
            ),
          },
          appManagerDashboard: {
            addAuthorizedRedirectUri: bindContext(
              VincentAppFacet.addAuthorizedRedirectUri,
            ),
            addDelegatee: bindContext(VincentAppFacet.addDelegatee),
            enableAppVersion: bindContext(VincentAppFacet.enableAppVersion),
            getAppsByManager: bindContext(VincentAppViewFacet.getAppsByManager),
            isLitActionApproved: bindContext(
              VincentLitActionViewFacet.isLitActionApproved,
            ),
            registerApp: bindContext(VincentAppFacet.registerApp),
            registerNextAppVersion: bindContext(
              VincentAppFacet.registerNextAppVersion,
            ),
            removeAuthorizedRedirectUri: bindContext(
              VincentAppFacet.removeAuthorizedRedirectUri,
            ),
            removeDelegatee: bindContext(VincentAppFacet.removeDelegatee),
          },
          toolLitActions: {
            validateToolExecutionAndGetPolicies: bindContext(
              VincentUserViewFacet.validateToolExecutionAndGetPolicies,
            ),
          },
          litManager: {
            getAllApprovedLitActions:
              VincentLitActionViewFacet.getAllApprovedLitActions,
            getApprovedLitActionsManager:
              VincentLitActionViewFacet.getApprovedLitActionsManager,
            removeLitActionApprovals: bindContext(
              VincentLitActionFacet.removeLitActionApprovals,
            ),
            updateApprovedLitActionsManager: bindContext(
              VincentLitActionFacet.updateApprovedLitActionsManager,
            ),
          },
          userDashboard: {
            getAllPermittedAppIdsForPkp: bindContext(
              VincentUserViewFacet.getAllPermittedAppIdsForPkp,
            ),
            getAllRegisteredAgentPkps: bindContext(
              VincentUserViewFacet.getAllRegisteredAgentPkps,
            ),
            getAllToolsAndPoliciesForApp: bindContext(
              VincentUserViewFacet.getAllToolsAndPoliciesForApp,
            ),
            getAppById: bindContext(VincentAppViewFacet.getAppById),
            getAppVersion: bindContext(VincentAppViewFacet.getAppVersion),
            getPermittedAppVersionForPkp: bindContext(
              VincentUserViewFacet.getPermittedAppVersionForPkp,
            ),
            permitAppVersion: bindContext(VincentUserFacet.permitAppVersion),
            removeToolPolicyParameters: bindContext(
              VincentUserFacet.removeToolPolicyParameters,
            ),
            setToolPolicyParameters: bindContext(
              VincentUserFacet.setToolPolicyParameters,
            ),
            unPermitAppVersion: bindContext(
              VincentUserFacet.unPermitAppVersion,
            ),
          },
          unknown: {
            getAppByDelegatee: bindContext(
              VincentAppViewFacet.getAppByDelegatee,
            ),
            getAuthorizedRedirectUriByHash: bindContext(
              VincentAppViewFacet.getAuthorizedRedirectUriByHash,
            ),
            getAuthorizedRedirectUrisByAppId: bindContext(
              VincentAppViewFacet.getAuthorizedRedirectUrisByAppId,
            ),
            getTotalAppCount: bindContext(VincentAppViewFacet.getTotalAppCount),
            getLitActionIpfsCidByHash: bindContext(
              VincentLitActionViewFacet.getLitActionIpfsCidByHash,
            ),
          },
        },
      };
    default:
      throw new Error(`Unsupported network: ${config.network}`);
  }
}

// export function createNagaChainManager(config: NagaChainManagerConfig) {

// }

export function getChain(chain: 'chronicle-yellowstone' | 'anvil') {
  switch (chain) {
    case 'chronicle-yellowstone':
      return ChrnoicleYellowstone;
    case 'anvil':
      return Anvil;
    default:
      throw new Error(`Unsupported chain: ${chain}`);
  }
}

// if (import.meta.main) {
//   // Setup a wallet client
//   const privateKey =
//     '0xa2fcb1ba1ca9832c64e5e7afa616a5837da0bef84d0e1b0debbbdebce013547e';
//   const account = privateKeyToAccount(privateKey);

//   const chainManager = createDatilChainManager({
//     account,
//     network: 'datil-mainnet',
//   });

//   const result = await chainManager.vincentApi.appManagerDashboard.registerApp({
//     appName: 'My New App',
//     appDescription: 'A description of my application',
//     authorizedRedirectUris: ['https://myapp.com/callback'],
//     delegatees: ['0x1234567890abcdef1234567890abcdef12345678'],
//     toolIpfsCids: ['QmUT4Ke8cPtJYRZiWrkoG9RZc77hmRETNQjvDYfLtrMUEY'],
//     toolPolicies: [['QmcLbQPohPURMuNdhYYa6wyDp9pm6eHPdHv9TRgFkPVebE']],
//     toolPolicyParameterNames: [[['param1']]],
//     toolPolicyParameterTypes: [[['INT256']]],
//   });

//   console.log('App registered successfully:', result);
// }
