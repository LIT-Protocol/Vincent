import { vincentSignatures as datilSignatures } from './networks/vDatil/datil-mainnet/vincent-signatures';
import { vincentContractData as datilContractData } from './networks/vDatil/datil-mainnet/vincent-contract-data';
import { vincentDiamondAddress as datilDiamondAddress } from './networks/vDatil/datil-mainnet/vincent-contract-data';

export const vincentContractData = {
  datil: {
    signatures: datilSignatures,
    contractData: datilContractData,
    diamondAddress: datilDiamondAddress,
  },
} as const;

export {
  createDatilChainManager,
  getChain,
} from './LitChainManager/createChainManager';

export { createPolicyParameterValue } from './networks/vDatil/shared/VincentChainClient/apis/rawContractApis/VincentAppFacet/schemas/ParameterType';
