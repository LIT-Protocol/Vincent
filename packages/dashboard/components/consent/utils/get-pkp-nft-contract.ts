import { ethers } from 'ethers';
import { LIT_NETWORKS_KEYS } from '@lit-protocol/types';
import { LIT_RPC } from '@lit-protocol/constants';
import {
  datil,
  datilDev,
  datilTest,
} from "@lit-protocol/contracts";

function getContractFromJsSdk(
  network: string,
  contractName: string,
  provider: ethers.providers.JsonRpcProvider
) {
  let contractsDataRes;
  switch (network) {
    case "datil-dev":
      contractsDataRes = datilDev;
      break;
    case "datil-test":
      contractsDataRes = datilTest;
      break;
    case "datil":
      contractsDataRes = datil;
      break;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }

  const contractList = contractsDataRes.data as any;
  const contractData = contractList.find(
    (contract: any) => contract.name === contractName
  );

  if (!contractData) {
    throw new Error(`No contract found with name ${contractName}`);
  }

  const contract = contractData.contracts[0];
  return new ethers.Contract(
    contract.address_hash,
    contract.ABI,
    provider
  );
}

export function getPkpNftContract(network: LIT_NETWORKS_KEYS) {
  const provider = new ethers.providers.JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE);
  return getContractFromJsSdk(network, "PKPNFT", provider);
} 