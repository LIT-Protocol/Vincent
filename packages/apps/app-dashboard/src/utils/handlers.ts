import { ethers } from 'ethers';
import { JsonRpcProvider as V6JsonRpcProvider, Contract as V6Contract } from 'ethers-v6';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { StatusType } from '@/components/withdraw';
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
      litNetwork: SELECTED_LIT_NETWORK,
    });
    await litNodeClient.connect();
    isLitNodeClientInitialized = true;
  }
  return litNodeClient;
}

type ShowStatusFn = (message: string, type: StatusType) => void;

// Standard ERC20 token ABI - just the functions we need
const ERC20_ABI = [
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
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
  isConfirming = false,
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
      rpc: rpcUrl,
    });

    await pkpWallet.init();

    const provider = new V6JsonRpcProvider(rpcUrl);

    // Default token setup
    let token = {
      address: chain.contractAddress!,
      symbol: chain.symbol,
      decimals: chain.decimals,
    };

    let amount: ethers.BigNumber;

    if (isCustomToken && ethers.utils.isAddress(tokenAddress)) {
      showStatus('Fetching token details...', 'info');

      try {
        const tokenContract = new V6Contract(tokenAddress, ERC20_ABI, provider);
        const [symbol, decimals] = await Promise.all([
          tokenContract.symbol(),
          tokenContract.decimals(),
        ]);

        token = {
          address: tokenAddress,
          symbol,
          decimals,
        };

        amount = ethers.utils.parseUnits(withdrawAmount, token.decimals);
        showStatus(`Detected token: ${symbol}`, 'info');
      } catch (error: unknown) {
        console.error('Error fetching token details:', error);
        showStatus('Could not fetch token details. Check token address and try again.', 'error');
        return { success: false };
      }
    } else {
      amount = ethers.utils.parseUnits(withdrawAmount, token.decimals);
    }

    if (!isConfirming) {
      showStatus('Estimating gas costs...', 'info');

      let gasEstimate;

      if (isCustomToken) {
        // Simulate token transfer
        const tokenContract = new V6Contract(
          tokenAddress,
          ['function transfer(address to, uint256 amount) returns (bool)'],
          provider,
        );

        const data = tokenContract.interface.encodeFunctionData('transfer', [
          withdrawAddress,
          BigInt(amount.toString()),
        ]);

        gasEstimate = await provider.estimateGas({
          to: tokenAddress,
          data: data,
          from: await pkpWallet.getAddress(),
          value: 0,
        });
      } else {
        // Simulate native transfer
        gasEstimate = await provider.estimateGas({
          to: withdrawAddress,
          value: BigInt(amount.toString()),
          from: await pkpWallet.getAddress(),
        });
      }

      const feeData = await provider.getFeeData();

      // Require gas price data - no fallbacks
      if (!feeData.gasPrice) {
        showStatus('Failed to fetch gas price data', 'error');
        return { success: false };
      }

      let gasPrice: ethers.BigNumber;
      if (feeData.maxPriorityFeePerGas) {
        gasPrice = ethers.BigNumber.from(feeData.gasPrice.toString()).add(
          ethers.BigNumber.from(feeData.maxPriorityFeePerGas.toString()),
        );
      } else {
        gasPrice = ethers.BigNumber.from(feeData.gasPrice.toString());
      }

      const gasCost = ethers.BigNumber.from(gasEstimate.toString()).mul(gasPrice);
      const gasCostEth = ethers.utils.formatEther(gasCost);

      // Try to get USD price
      let costDisplay = `${gasCostEth} ${chain.symbol}`;

      // Map chain symbols to CoinGecko IDs
      const symbolToCoinGeckoId: { [key: string]: string } = {
        ETH: 'ethereum',
        MATIC: 'matic-network',
        BNB: 'binancecoin',
        AVAX: 'avalanche-2',
        FTM: 'fantom',
        xDai: 'xdai',
        ONE: 'harmony',
        CRO: 'crypto-com-chain',
        CELO: 'celo',
        XDC: 'xdce-crowd-sale',
        EVMOS: 'evmos',
        DEV: 'moonbeam',
        AETH: 'ethereum',
      };

      const coinId = symbolToCoinGeckoId[chain.symbol];
      if (coinId) {
        try {
          const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
          );
          if (response.ok) {
            const data = await response.json();
            const tokenPrice = data[coinId]?.usd;
            if (tokenPrice) {
              const gasCostUsd = (parseFloat(gasCostEth) * tokenPrice).toFixed(4);
              costDisplay = `${gasCostEth} ${chain.symbol} (~$${gasCostUsd})`;
            }
          }
        } catch (e) {
          // If USD price fetch fails, just use native token display
        }
      }

      showStatus(
        `Ready to send ${withdrawAmount} ${token.symbol} to ${withdrawAddress.slice(0, 6)}...${withdrawAddress.slice(-4)}.<br/>Estimated gas cost: ${costDisplay}`,
        'info',
      );

      return { success: true, needsConfirmation: true };
    }

    showStatus('Sending transaction...', 'info');

    let transactionResult;
    if (isCustomToken) {
      transactionResult = await sendTokenTransaction({
        pkpWallet,
        tokenDetails: token,
        amount,
        recipientAddress: withdrawAddress,
        provider,
      });
    } else {
      transactionResult = await sendNativeTransaction({
        pkpWallet,
        amount,
        recipientAddress: withdrawAddress,
        provider,
      });
    }

    const explorerUrl = chain.blockExplorerUrls[0];
    const explorerTxUrl = `${explorerUrl}/tx/${transactionResult.hash}`;

    if (transactionResult.success) {
      showStatus(
        `${token.symbol} withdrawal confirmed!&nbsp;&nbsp;<a href="${explorerTxUrl}" target="_blank" rel="noopener noreferrer" class="text-black underline">View transaction</a>`,
        'success',
      );
      return { success: true };
    } else {
      if (transactionResult.hash) {
        showStatus(
          `Transaction may have failed.&nbsp;&nbsp;<a href="${explorerTxUrl}" target="_blank" rel="noopener noreferrer" class="text-black underline">Check on explorer</a>`,
          'warning',
        );
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
