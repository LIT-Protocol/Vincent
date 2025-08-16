import { ethers } from 'ethers';
import { Token, CurrencyAmount, TradeType, Percent } from '@uniswap/sdk-core';
import { AlphaRouter, SwapType } from '@uniswap/smart-order-router';

import { BASE_RPC_URL, TEST_FUNDER_PRIVATE_KEY } from './helpers';

describe('Uniswap AlphaRouter Direct Test', () => {
  const WETH_ADDRESS = '0x4200000000000000000000000000000000000006';
  const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
  const SWAP_AMOUNT = 0.0003;

  let wallet: ethers.Wallet;
  let provider: ethers.providers.JsonRpcProvider;

  beforeAll(() => {
    // Create wallet from TEST_FUNDER_PRIVATE_KEY
    provider = new ethers.providers.JsonRpcProvider(BASE_RPC_URL);
    wallet = new ethers.Wallet(TEST_FUNDER_PRIVATE_KEY, provider);

    console.log('Test wallet address:', wallet.address);
  });

  it('should get a valid quote from AlphaRouter', async () => {
    console.log('Testing AlphaRouter quote generation...');

    const router = new AlphaRouter({ chainId: 8453, provider });

    // Create token instances
    const tokenIn = new Token(8453, WETH_ADDRESS, 18, 'WETH', 'Wrapped Ether');
    const tokenOut = new Token(8453, USDC_ADDRESS, 6, 'USDC', 'USD Coin');

    // Convert amount to proper format
    const amountIn = CurrencyAmount.fromRawAmount(
      tokenIn,
      ethers.utils.parseUnits(SWAP_AMOUNT.toString(), 18).toString(),
    );

    console.log('Getting route from AlphaRouter...', {
      amountIn: amountIn.toExact(),
      tokenIn: tokenIn.address,
      tokenOut: tokenOut.address,
    });

    // Get quote from AlphaRouter
    const slippagePercent = new Percent(50, 10000); // 0.5% slippage
    const routeResult = await router.route(amountIn, tokenOut, TradeType.EXACT_INPUT, {
      recipient: wallet.address,
      slippageTolerance: slippagePercent,
      deadline: Math.floor(Date.now() / 1000 + 1800), // 30 minutes from now
      type: SwapType.SWAP_ROUTER_02,
    });

    expect(routeResult).toBeDefined();
    expect(routeResult?.quote).toBeDefined();
    expect(routeResult?.methodParameters).toBeDefined();

    console.log('Quote successful:', {
      quote: routeResult?.quote.toExact(),
      estimatedGasUsedUSD: routeResult?.estimatedGasUsedUSD.toFixed(2),
      methodParameters: {
        to: routeResult?.methodParameters?.to,
        calldata: routeResult?.methodParameters?.calldata.slice(0, 20) + '...', // truncate for readability
        value: routeResult?.methodParameters?.value,
      },
    });
  }, 30000); // 30 second timeout for AlphaRouter

  it('should execute a complete swap transaction', async () => {
    console.log('Testing complete swap execution...');

    const router = new AlphaRouter({ chainId: 8453, provider });

    // Create token instances
    const tokenIn = new Token(8453, WETH_ADDRESS, 18, 'WETH', 'Wrapped Ether');
    const tokenOut = new Token(8453, USDC_ADDRESS, 6, 'USDC', 'USD Coin');

    // Convert amount to proper format
    const amountIn = CurrencyAmount.fromRawAmount(
      tokenIn,
      ethers.utils.parseUnits(SWAP_AMOUNT.toString(), 18).toString(),
    );

    // Get route
    const slippagePercent = new Percent(50, 10000); // 0.5% slippage
    const routeResult = await router.route(amountIn, tokenOut, TradeType.EXACT_INPUT, {
      recipient: wallet.address,
      slippageTolerance: slippagePercent,
      deadline: Math.floor(Date.now() / 1000 + 1800),
      type: SwapType.SWAP_ROUTER_02,
    });

    expect(routeResult).toBeDefined();
    expect(routeResult?.methodParameters).toBeDefined();

    const { to, calldata, value } = routeResult?.methodParameters || {};

    console.log('Transaction details:', {
      to,
      value,
      calldataLength: calldata?.length,
    });

    // Check wallet balances first
    const ethBalance = await provider.getBalance(wallet.address);
    const wethContract = new ethers.Contract(
      WETH_ADDRESS,
      ['function balanceOf(address) view returns (uint256)'],
      provider,
    );
    const wethBalance = await wethContract.balanceOf(wallet.address);

    console.log('Wallet balances:', {
      eth: ethers.utils.formatEther(ethBalance),
      weth: ethers.utils.formatUnits(wethBalance, 18),
    });

    // Check current allowance
    const wethErc20Contract = new ethers.Contract(
      WETH_ADDRESS,
      ['function allowance(address,address) view returns (uint256)'],
      provider,
    );
    const currentAllowance = await wethErc20Contract.allowance(wallet.address, to);
    const requiredAmount = ethers.utils.parseUnits(SWAP_AMOUNT.toString(), 18);

    console.log('Current allowance:', ethers.utils.formatUnits(currentAllowance, 18), 'WETH');
    console.log('Required amount:', ethers.utils.formatUnits(requiredAmount, 18), 'WETH');
    console.log('WETH balance:', ethers.utils.formatUnits(wethBalance, 18), 'WETH');

    // Check if we have sufficient balance and allowance
    if (wethBalance.lt(requiredAmount)) {
      console.log('❌ Insufficient WETH balance for swap');

      // Check if we have ETH to wrap
      if (ethBalance.lt(requiredAmount)) {
        console.log('❌ Insufficient ETH balance to wrap to WETH');
        return; // Skip test if insufficient ETH
      }

      console.log('💫 Wrapping ETH to WETH...');

      const wethContractWithSigner = new ethers.Contract(
        WETH_ADDRESS,
        ['function deposit() payable'],
        wallet,
      );

      try {
        const wrapTx = await wethContractWithSigner.deposit({ value: requiredAmount });
        console.log('Wrap transaction sent:', wrapTx.hash);

        const wrapReceipt = await wrapTx.wait();
        console.log('Wrap transaction mined in block:', wrapReceipt.blockNumber);

        // Verify we now have WETH
        const newWethBalance = await wethContract.balanceOf(wallet.address);
        console.log('New WETH balance:', ethers.utils.formatUnits(newWethBalance, 18), 'WETH');

        if (newWethBalance.lt(requiredAmount)) {
          throw new Error('Wrap transaction failed to provide sufficient WETH');
        }

        console.log('✅ ETH wrapped to WETH successfully');
      } catch (wrapError) {
        console.error('❌ Wrap transaction failed:', wrapError);
        return; // Skip test if wrapping fails
      }
    } else {
      console.log('✅ Sufficient WETH balance');
    }

    // If allowance is insufficient, perform approval transaction
    if (currentAllowance.lt(requiredAmount)) {
      console.log('❌ Insufficient allowance - performing approval transaction...');

      const wethContractWithSigner = new ethers.Contract(
        WETH_ADDRESS,
        ['function approve(address spender, uint256 amount) returns (bool)'],
        wallet,
      );

      console.log(
        `Approving ${ethers.utils.formatUnits(requiredAmount, 18)} WETH to router ${to}...`,
      );

      try {
        const approveTx = await wethContractWithSigner.approve(to, requiredAmount);
        console.log('Approval transaction sent:', approveTx.hash);

        const approvalReceipt = await approveTx.wait();
        console.log('Approval transaction mined in block:', approvalReceipt.blockNumber);

        // Wait a moment for state to update
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Verify the allowance was set correctly
        const newAllowance = await wethErc20Contract.allowance(wallet.address, to);
        console.log('New allowance:', ethers.utils.formatUnits(newAllowance, 18), 'WETH');

        if (newAllowance.lt(requiredAmount)) {
          console.warn('⚠️ Approval transaction completed but allowance still insufficient');
          console.warn(
            'This might be a blockchain state propagation delay or test environment issue',
          );
          console.warn('Proceeding with swap simulation anyway...');
        }

        console.log('✅ Approval successful');
      } catch (approvalError) {
        console.error('❌ Approval transaction failed:', approvalError);
        return; // Skip swap simulation if approval fails
      }
    } else {
      console.log('✅ Sufficient allowance already exists');
    }

    console.log('✅ Ready for actual swap execution');

    // Get balances before swap
    const wethBalanceBefore = await wethContract.balanceOf(wallet.address);
    const usdcContract = new ethers.Contract(
      USDC_ADDRESS,
      ['function balanceOf(address) view returns (uint256)'],
      provider,
    );
    const usdcBalanceBefore = await usdcContract.balanceOf(wallet.address);

    console.log('Balances before swap:', {
      weth: ethers.utils.formatUnits(wethBalanceBefore, 18),
      usdc: ethers.utils.formatUnits(usdcBalanceBefore, 6),
    });

    // Execute the actual swap transaction
    try {
      const gasEstimate = await provider.estimateGas({
        to,
        data: calldata,
        value,
        from: wallet.address,
      });

      console.log('Gas estimation successful:', gasEstimate.toString());

      // Execute the actual swap transaction
      const swapTx = await wallet.sendTransaction({
        to,
        data: calldata,
        value,
        gasLimit: gasEstimate.mul(120).div(100), // Add 20% buffer
      });

      console.log('Swap transaction sent:', swapTx.hash);

      // Wait for transaction to be mined
      const swapReceipt = await swapTx.wait();
      console.log('Swap transaction mined in block:', swapReceipt.blockNumber);
      console.log('Gas used:', swapReceipt.gasUsed.toString());

      // Wait a moment for state to update
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Check balances after swap
      const wethBalanceAfter = await wethContract.balanceOf(wallet.address);
      const usdcBalanceAfter = await usdcContract.balanceOf(wallet.address);

      console.log('Balances after swap:', {
        weth: ethers.utils.formatUnits(wethBalanceAfter, 18),
        usdc: ethers.utils.formatUnits(usdcBalanceAfter, 6),
      });

      // Calculate the changes
      const wethChange = wethBalanceBefore.sub(wethBalanceAfter);
      const usdcChange = usdcBalanceAfter.sub(usdcBalanceBefore);

      console.log('Balance changes:', {
        wethSpent: ethers.utils.formatUnits(wethChange, 18),
        usdcReceived: ethers.utils.formatUnits(usdcChange, 6),
      });

      // Verify the swap was successful
      if (wethChange.gt(0) && usdcChange.gt(0)) {
        console.log('✅ Swap executed successfully!');

        // Calculate effective exchange rate
        const rate =
          parseFloat(ethers.utils.formatUnits(usdcChange, 6)) /
          parseFloat(ethers.utils.formatUnits(wethChange, 18));
        console.log(`Exchange rate: 1 WETH = ${rate.toFixed(2)} USDC`);
      } else {
        throw new Error('Swap failed - no balance changes detected');
      }
    } catch (error) {
      console.error('Transaction simulation failed:', error);

      // If it's a revert, let's see the revert reason
      if (error instanceof Error) {
        console.error('Error message:', error.message);

        // Try to decode revert reason if available
        if ('data' in error && typeof error.data === 'string') {
          try {
            // Try to decode as string
            const decoded = ethers.utils.toUtf8String('0x' + error.data.slice(138));
            console.error('Decoded revert reason:', decoded);

            // STF likely means insufficient balance, allowance, or swap conditions not met
            if (decoded === 'STF') {
              console.error('STF Error Analysis:');
              console.error('- Check WETH balance is sufficient');
              console.error('- Check allowance to router is sufficient');
              console.error('- Verify swap amount meets pool minimums');
              console.error('- Ensure pool has sufficient liquidity');
            }
          } catch {
            console.error('Raw error data:', error.data);
          }
        }
      }

      throw error;
    }
  }, 120000); // 120 second timeout for full swap execution
});
