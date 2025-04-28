import { ethers } from 'ethers';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { StatusType } from '@/components/withdraw/types';
import { sendTokenTransaction, sendNativeTransaction } from './transactionService';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { SessionSigs, IRelayPKP } from '@lit-protocol/types';
import { SELECTED_LIT_NETWORK } from '@/components/consent/utils/lit';
import { LIT_CHAINS } from '@lit-protocol/constants';

let isLitNodeClientInitialized = false;
let litNodeClient: LitNodeClient;

async function initLitNodeClient() {
  if (!isLitNodeClientInitialized) {
    litNodeClient = new LitNodeClient({
      litNetwork: SELECTED_LIT_NETWORK
    });
    await litNodeClient.connect();
    isLitNodeClientInitialized = true;
  }
  return litNodeClient;
}

type ShowStatusFn = (message: string, type: StatusType) => void;

// Standard ERC20 token ABI - just the functions we need
const ERC20_ABI = [
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
];

export const handleSubmit = async (
  isCustomToken: boolean,
  tokenAddress: string,
  withdrawAmount: string,
  withdrawAddress: string,
  agentPKP: IRelayPKP,
  sessionSigs: SessionSigs,
  chainId: string,
  setLoading: (loading: boolean) => void,
  showStatus: ShowStatusFn,
) => {
  if (!withdrawAmount || !withdrawAddress) {
    showStatus('Please fill all fields', 'warning');
    return { success: false };
  }

  if (parseFloat(withdrawAmount) === 0) {
    showStatus('Withdrawal amount cannot be zero', 'warning');
    return { success: false };
  }

  if (!ethers.utils.isAddress(withdrawAddress)) {
    showStatus('Invalid withdrawal address', 'error');
    return { success: false };
  }

  try {
    setLoading(true);
    showStatus('Preparing withdrawal...', 'info');

    const chain = LIT_CHAINS[chainId];
    const rpcUrl = chain.rpcUrls?.[0];

    litNodeClient = await initLitNodeClient();

    const pkpWallet = new PKPEthersWallet({
      pkpPubKey: agentPKP.publicKey,
      litNodeClient: litNodeClient,
      controllerSessionSigs: sessionSigs,
      rpc: rpcUrl
    });

    await pkpWallet.init();

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    // Default token setup
    let token = {
      address: chain.contractAddress!,
      symbol: chain.symbol,
      decimals: chain.decimals,
    };

    let transactionResult;
    if (isCustomToken && ethers.utils.isAddress(tokenAddress)) {
      showStatus('Fetching token details...', 'info');

      try {
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
        const [symbol, decimals] = await Promise.all([
          tokenContract.symbol(),
          tokenContract.decimals()
        ]);

        token = {
          address: tokenAddress,
          symbol,
          decimals
        };

        const amount = ethers.utils.parseUnits(withdrawAmount, token.decimals);

        transactionResult = await sendTokenTransaction({
          pkpWallet,
          tokenDetails: token,
          amount,
          recipientAddress: withdrawAddress,
          provider
        });
        showStatus(`Detected token: ${symbol}`, 'info');
      } catch (error: unknown) {
        console.error('Error fetching token details:', error);
        showStatus('Could not fetch token details. Check token address and try again.', 'error');
        return { success: false };
      }
    } else {
       transactionResult = await sendNativeTransaction({
        pkpWallet,
        amount: ethers.utils.parseUnits(withdrawAmount, token.decimals),
        recipientAddress: withdrawAddress,
        provider
      });
    }

    const explorerUrl = chain.blockExplorerUrls[0];
    const explorerTxUrl = `${explorerUrl}/tx/${transactionResult.hash}`

    if (transactionResult.success) {
      showStatus(`${token.symbol} withdrawal confirmed!&nbsp;&nbsp;<a href="${explorerTxUrl}" target="_blank" rel="noopener noreferrer" class="text-black underline">View transaction</a>`, 'success');
      return { success: true };
    } else {
      if (transactionResult.hash) {
        showStatus(`Transaction may have failed.&nbsp;&nbsp;<a href="${explorerTxUrl}" target="_blank" rel="noopener noreferrer" class="text-black underline">Check on explorer</a>`, 'warning');
      } else {
        showStatus(transactionResult.error || 'Transaction failed', 'error');
      }
      return { success: false };
    }

  } catch (err: unknown) {
    console.error('Error submitting withdrawal:', err);
    showStatus('Failed to submit withdrawal', 'error');
    return { success: false };
  } finally {
    setLoading(false);
  }
};
