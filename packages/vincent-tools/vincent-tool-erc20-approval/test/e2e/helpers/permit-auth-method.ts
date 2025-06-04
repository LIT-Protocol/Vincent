import { ethers } from 'ethers';
import { LIT_NETWORK, AUTH_METHOD_SCOPE } from '@lit-protocol/constants';
import { LitContracts } from '@lit-protocol/contracts-sdk';

const YELLOWSTONE_RPC_URL = 'https://yellowstone-rpc.litprotocol.com/';

export const permitAuthMethod = async (
  pkpOwnerPrivateKey: string,
  pkpTokenId: string,
  vincentErc20ApprovalToolIpfsCid: string,
  vincentUniswapSwapToolIpfsCid: string,
  vincentUniswapSwapPolicyIpfsCid: string,
  litNetwork = 'datil',
) => {
  const provider = new ethers.providers.JsonRpcProvider(YELLOWSTONE_RPC_URL);
  const pkpOwnerWallet = new ethers.Wallet(pkpOwnerPrivateKey as string, provider);

  const litContractClient = new LitContracts({
    signer: pkpOwnerWallet,
    network: LIT_NETWORK[litNetwork as keyof typeof LIT_NETWORK] || LIT_NETWORK.Datil,
  });
  await litContractClient.connect();

  console.log(`Adding permitted auth method for tool: ${vincentErc20ApprovalToolIpfsCid}`);
  await litContractClient.addPermittedAction({
    pkpTokenId,
    ipfsId: vincentErc20ApprovalToolIpfsCid,
    authMethodScopes: [AUTH_METHOD_SCOPE.SignAnything],
  });

  console.log(`Adding permitted auth method for tool: ${vincentUniswapSwapToolIpfsCid}`);
  await litContractClient.addPermittedAction({
    pkpTokenId,
    ipfsId: vincentUniswapSwapToolIpfsCid,
    authMethodScopes: [AUTH_METHOD_SCOPE.SignAnything],
  });

  console.log(`Adding permitted auth method for policy: ${vincentUniswapSwapPolicyIpfsCid}`);
  await litContractClient.addPermittedAction({
    pkpTokenId,
    ipfsId: vincentUniswapSwapPolicyIpfsCid,
    authMethodScopes: [AUTH_METHOD_SCOPE.SignAnything],
  });
};
