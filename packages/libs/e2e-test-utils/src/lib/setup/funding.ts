import { Wallet, BigNumber } from 'ethers';
import { formatEther, parseEther } from 'viem';

/**
 * Convert ethers BigNumber to bigint
 */
function toBigInt(bn: BigNumber): bigint {
  return BigInt(bn.toString());
}

const FUND_AMOUNT = parseEther('0.01');
const MIN_AMOUNT = parseEther('0.005');
const MINIMUM_FUNDER_BALANCE = parseEther('0.13');

/**
 * Check if the funder wallet has sufficient balance
 * @param funderWallet The funder wallet to check
 * @throws Error if funder balance is below minimum threshold
 */
export async function checkFunderBalance(funderWallet: Wallet): Promise<bigint> {
  const funderBalanceBN = await funderWallet.provider!.getBalance(funderWallet.address);
  const funderBalance = toBigInt(funderBalanceBN);
  console.log(`Funder Balance: ${formatEther(funderBalance)} Lit tokens`);

  if (funderBalance < MINIMUM_FUNDER_BALANCE) {
    const errorMessage = `❌ Insufficient funder balance. Current balance is below the required ${formatEther(MINIMUM_FUNDER_BALANCE)} threshold. Please top up your funder wallet at: https://chronicle-yellowstone-faucet.getlit.dev/`;
    console.log(errorMessage);
    throw new Error(errorMessage);
  }

  return funderBalance;
}

/**
 * Ensure a wallet has sufficient test tokens, funding it from the funder wallet if needed
 * @param address The address to check and fund
 * @param funderWallet The funder wallet to use for funding
 * @param minAmountEther Optional minimum amount in ether (default: 0.005)
 */
export async function ensureWalletHasTestTokens({
  address,
  funderWallet,
  minAmountEther,
}: {
  address: string;
  funderWallet: Wallet;
  minAmountEther?: string;
}): Promise<void> {
  const minAmount = minAmountEther ? parseEther(minAmountEther) : MIN_AMOUNT;

  const walletBalanceBN = await funderWallet.provider!.getBalance(address);
  const walletBalance = toBigInt(walletBalanceBN);
  const fundAmount = minAmount > FUND_AMOUNT ? minAmount - walletBalance : FUND_AMOUNT;

  if (walletBalance >= minAmount) {
    console.log(`ℹ️  ${address} has ${formatEther(walletBalance)} Lit test tokens`);
    return;
  } else {
    console.log(`ℹ️  ${address} has less than ${formatEther(minAmount)}`);
    console.log(`ℹ️  Minimum of ${formatEther(minAmount)} Lit test tokens are required`);
    console.log(
      `ℹ️  Funding ${address} with ${formatEther(fundAmount)} Lit test tokens from funder account: ${funderWallet.address}...`,
    );

    const tx = await funderWallet.sendTransaction({
      to: address,
      value: fundAmount,
    });

    const txReceipt = await tx.wait();
    if (txReceipt?.status !== 1) {
      throw new Error(`Transaction failed. Tx hash: ${txReceipt?.transactionHash}`);
    }

    console.log(
      `ℹ️  Funded ${address} with ${formatEther(fundAmount)} Lit test tokens\nTx hash: ${txReceipt.transactionHash}`,
    );
  }
}

/**
 * Ensure the app manager wallet is funded with test tokens
 * @param appManagerAddress The app manager address to fund
 * @param funderWallet The funder wallet to use for funding
 */
export async function ensureAppManagerFunded(
  appManagerAddress: string,
  funderWallet: Wallet,
): Promise<void> {
  return ensureWalletHasTestTokens({ address: appManagerAddress, funderWallet });
}
