import { ethers } from 'ethers';

export const MIN_BASE_SEPOLIA_BALANCE = ethers.utils.parseEther('0.005');
export const TARGET_BASE_SEPOLIA_BALANCE = ethers.utils.parseEther('0.02');
export const REFUND_BUFFER = ethers.utils.parseEther('0.0005');

type BalanceManagerOptions = {
  provider: ethers.providers.JsonRpcProvider;
  funder?: ethers.Wallet;
  refundTo?: string;
  minBalance: ethers.BigNumber;
  targetBalance: ethers.BigNumber;
  refundBuffer: ethers.BigNumber;
  shouldRefund: boolean;
};

type EnsureBalanceOptions = {
  signer: ethers.Wallet;
  label: string;
};

/**
 * Creates a small balance manager for E2E tests that can top up signer wallets
 * and refund any leftover funds at the end of the run.
 */
export const createBalanceManager = ({
  provider,
  funder,
  refundTo,
  minBalance,
  targetBalance,
  refundBuffer,
  shouldRefund,
}: BalanceManagerOptions) => {
  const tracked = new Map<string, EnsureBalanceOptions>();
  const refundRecipient = refundTo ?? funder?.address;

  const ensureBalance = async ({ signer, label }: EnsureBalanceOptions) => {
    tracked.set(signer.address.toLowerCase(), { signer, label });
    const balance = await provider.getBalance(signer.address);
    if (balance.gte(minBalance)) {
      return;
    }

    if (!funder) {
      throw new Error(
        `Base Sepolia ${label} (${signer.address}) has ${ethers.utils.formatEther(
          balance,
        )} ETH. Fund this address or set TEST_BASE_SEPOLIA_PRIVATE_KEY/TEST_FUNDER_PRIVATE_KEY and re-run the tests.`,
      );
    }

    if (funder.address.toLowerCase() === signer.address.toLowerCase()) {
      throw new Error(
        `Base Sepolia ${label} (${signer.address}) has ${ethers.utils.formatEther(
          balance,
        )} ETH. Fund this address and re-run the tests.`,
      );
    }

    const topUpAmount = targetBalance.sub(balance);
    if (topUpAmount.lte(ethers.constants.Zero)) {
      return;
    }

    const funderBalance = await provider.getBalance(funder.address);
    if (funderBalance.lt(topUpAmount)) {
      throw new Error(
        `Base Sepolia ${label} (${signer.address}) has ${ethers.utils.formatEther(
          balance,
        )} ETH, and funder ${funder.address} has ${ethers.utils.formatEther(
          funderBalance,
        )} ETH. Fund either address and re-run the tests.`,
      );
    }

    console.log(
      `ℹ️  Funding ${label} on Base Sepolia (${signer.address}) with ${ethers.utils.formatEther(
        topUpAmount,
      )} ETH`,
    );
    const tx = await funder.sendTransaction({ to: signer.address, value: topUpAmount });
    await tx.wait();
    tracked.set(signer.address.toLowerCase(), { signer, label });
  };

  const refundAll = async () => {
    if (!shouldRefund) {
      return;
    }
    if (!funder || !refundRecipient) {
      console.warn('⚠️  REFUND_TEST_FUNDS is set but no funder key is available.');
      return;
    }

    for (const { signer, label } of tracked.values()) {
      if (signer.address.toLowerCase() === refundRecipient.toLowerCase()) {
        continue;
      }

      const balance = await provider.getBalance(signer.address);
      if (balance.lte(refundBuffer)) {
        continue;
      }

      const feeData = await provider.getFeeData();
      const gasLimit = ethers.BigNumber.from(21000);
      const fallbackGasPrice = ethers.utils.parseUnits('1', 'gwei');
      const gasPrice = feeData.gasPrice ?? feeData.maxFeePerGas ?? fallbackGasPrice;
      const overrides: ethers.providers.TransactionRequest = { gasLimit };

      if (feeData.gasPrice) {
        overrides.gasPrice = feeData.gasPrice;
      } else if (feeData.maxFeePerGas) {
        overrides.maxFeePerGas = feeData.maxFeePerGas;
        overrides.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? feeData.maxFeePerGas;
      } else {
        overrides.gasPrice = fallbackGasPrice;
      }

      const gasCost = gasLimit.mul(gasPrice);
      const refundable = balance.sub(gasCost).sub(refundBuffer);

      if (refundable.lte(ethers.constants.Zero)) {
        continue;
      }

      console.log(
        `ℹ️  Refunding ${label} on Base Sepolia (${signer.address}) with ${ethers.utils.formatEther(
          refundable,
        )} ETH to ${refundRecipient}`,
      );
      const tx = await signer.sendTransaction({
        to: refundRecipient,
        value: refundable,
        ...overrides,
      });
      await tx.wait();
    }
  };

  return {
    ensureBalance,
    refundAll,
  };
};
