import { vincentSignatures as datilSignatures } from "./networks/vDatil/datil-mainnet/vincent-signatures";
import { vincentContractData as datilContractData } from "./networks/vDatil/datil-mainnet/vincent-contract-data";
import { vincentDiamondAddress as datilDiamondAddress } from "./networks/vDatil/datil-mainnet/vincent-contract-data";

export const vincentContractData = {
  datil: {
    signatures: datilSignatures,
    contractData: datilContractData,
    diamondAddress: datilDiamondAddress
  }
} as const;