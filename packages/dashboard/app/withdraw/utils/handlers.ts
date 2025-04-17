import { ethers } from 'ethers';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { StatusType } from '../../../components/withdraw/types';
import { sendTokenTransaction } from './transactionService';
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
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint amount) returns (bool)"
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
  setWithdrawAmount: (amount: string) => void,
  setWithdrawAddress: (address: string) => void,
  showStatus: ShowStatusFn,
) => {
  if (!withdrawAmount || !withdrawAddress) {
    showStatus('Please fill all fields', 'warning');
    return;
  }

  if (parseFloat(withdrawAmount) === 0) {
    showStatus('Withdrawal amount cannot be zero', 'warning');
    return;
  }

  if (!ethers.utils.isAddress(withdrawAddress)) {
    showStatus('Invalid withdrawal address', 'error');
    return;
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
    
    // Unified token setup
    let token = {
      address: isCustomToken ? tokenAddress : ethers.constants.AddressZero,
      symbol: 'ETH',
      decimals: 18,
      isNative: true
    };

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
          decimals,
          isNative: false
        };
        
        showStatus(`Detected token: ${symbol}`, 'info');
      } catch (error) {
        showStatus('Could not fetch token details.', 'error');
        throw error;
      }
    }

    const amount = ethers.utils.parseUnits(withdrawAmount, token.decimals);

    const transactionResult = await sendTokenTransaction({
      pkpWallet,
      tokenDetails: token,
      amount,
      recipientAddress: withdrawAddress,
      provider
    });

    const explorerUrl = chain.blockExplorerUrls[0];
    console.log('explorerUrl', explorerUrl);

    if (transactionResult.success) {
      // Create a clickable link to the transaction on the explorer
      const explorerTxUrl = `${explorerUrl}tx/${transactionResult.hash}`
      showStatus(`${token.symbol} withdrawal confirmed!&nbsp;&nbsp;<a href="${explorerTxUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">View transaction</a>`, 'success');
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds delay

      // Reset form
      setWithdrawAmount('');
      setWithdrawAddress('');

    } else {
      if (transactionResult.hash) {
        const explorerTxUrl = `${explorerUrl}tx/${transactionResult.hash}`;
        showStatus(`Transaction may have failed.&nbsp;&nbsp;<a href="${explorerTxUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">Check on explorer</a>`, 'warning');
      } else {
        showStatus(transactionResult.error || 'Transaction failed', 'error');
      }
    }

  } catch (err: any) {
    console.error('Error submitting withdrawal:', err);
    showStatus('Failed to submit withdrawal', 'error');
  } finally {
    setLoading(false);
  }
}; 