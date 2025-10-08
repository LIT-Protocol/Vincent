import { ethers } from 'ethers';

import { bundledVincentAbility } from '../../src';
import { aaveIface, getAaveAddresses, getAvailableMarkets } from '../../src/lib/helpers/aave';
import { getErc20Contract, erc20Iface } from '../../src/lib/helpers/erc20';
import { lightIface } from '../../src/lib/helpers/lightAccount';
import { type UserOpv060 } from '../../src/lib/helpers/userOperation';
import { ENTRY_POINT, SMART_ACCOUNT_ADDRESS, RPC_URL, CHAIN_ID } from '../helpers/test-variables';

const {
  vincentAbility: { precheck },
} = bundledVincentAbility;

interface Transaction {
  from: string;
  to: string;
  data: string;
}
type TransactionBundle = [Transaction, Transaction, Transaction];

// Extend Jest timeout to 4 minutes
jest.setTimeout(240000);

const infiniteAmount = ethers.constants.MaxUint256.toString();
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

async function buildTxBundle(
  accountAddress: string,
  assetAddress: string,
  poolAddress: string,
): Promise<TransactionBundle> {
  // Determine decimals and amount to supply (example: 1 unit of the token)
  const erc20 = getErc20Contract(provider, assetAddress);
  const decimals = (await erc20.decimals()) as number;
  const desiredAmountHuman = '1';
  const desiredAmountWei = ethers.utils.parseUnits(desiredAmountHuman, decimals);
  const userBalanceWei = (await erc20.balanceOf(accountAddress)) as ethers.BigNumber;
  const amountWei = userBalanceWei.lt(desiredAmountWei) ? userBalanceWei : desiredAmountWei;

  const approveData = erc20Iface.encodeFunctionData('approve', [poolAddress, infiniteAmount]);
  const approveTx: Transaction = {
    from: accountAddress,
    to: assetAddress,
    data: approveData,
  };

  const supplyData = aaveIface.encodeFunctionData('supply', [
    assetAddress,
    amountWei,
    accountAddress,
    0,
  ]);
  const supplyTx: Transaction = {
    from: accountAddress,
    to: poolAddress,
    data: supplyData,
  };

  const withdrawData = aaveIface.encodeFunctionData('withdraw', [
    assetAddress,
    amountWei.sub(1), // That 1 is what aave almost always takes
    accountAddress,
  ]);
  const withdrawTx: Transaction = {
    from: accountAddress,
    to: poolAddress,
    data: withdrawData,
  };

  return [approveTx, supplyTx, withdrawTx];
}

describe('User ops simulation', () => {
  it('it should create and validate an aave user op', async () => {
    if (!precheck) {
      throw new Error('Precheck is not defined');
    }

    // Use helpers to get Aave and USDC addresses
    const { POOL } = getAaveAddresses(CHAIN_ID);

    const markets = getAvailableMarkets(CHAIN_ID);
    const asset = markets['USDC'];
    if (!asset) {
      throw new Error(`USDC not found in Aave markets for chain ${CHAIN_ID}`);
    }

    const txBundle = await buildTxBundle(SMART_ACCOUNT_ADDRESS, asset, POOL);
    const [approveTx, supplyTx, withdrawTx] = txBundle;

    // Batched transactions:
    const tos = [approveTx.to, supplyTx.to, withdrawTx.to];
    const datas = [approveTx.data, supplyTx.data, withdrawTx.data];
    const callData = lightIface.encodeFunctionData('executeBatch', [tos, datas]);

    const userOpv060: UserOpv060 = {
      callData,
      initCode: '0x',
      maxFeePerGas: '0x59682F00', // 1.5 gwei (adjust to network conditions)
      maxPriorityFeePerGas: '0x3B9ACA00', // 1 gwei
      paymasterAndData: '0x',
      sender: SMART_ACCOUNT_ADDRESS,
      signature:
        '0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c',
    };

    const precheckResult = await precheck(
      {
        abilityParams: {
          userOp: userOpv060,
          entryPointAddress: ENTRY_POINT,
          rpcUrl: RPC_URL,
        },
      },
      // @ts-expect-error - we are not using the full context
      {
        delegation: {
          delegateeAddress: '0xDelegateeAddress',
          delegatorPkpInfo: {
            ethAddress: '0xEthAddress',
            publicKey: '0xPublicKey',
            tokenId: '0xTokenId',
          },
        },
      },
    );

    expect(precheckResult.success).toBeTruthy();
    expect('runtimeError' in precheckResult).toBeFalsy();
    expect('schemaValidationError' in precheckResult).toBeFalsy();
    expect(precheckResult.success).toBeTruthy();
    expect(precheckResult.result).toBeDefined();

    // @ts-expect-error - direct call to precheck does not type this
    const { simulationChanges, userOp } = precheckResult.result;

    // simulationChanges
    expect(simulationChanges).toBeDefined();
    expect(simulationChanges.length).toBe(6);

    // userOp
    expect(userOp.callData).toBeDefined();
    expect(userOp.callGasLimit).toBeDefined();
    expect(userOp.preVerificationGas).toBeDefined();
    expect(userOp.initCode).toBeDefined();
    expect(userOp.maxFeePerGas).toBeDefined();
    expect(userOp.maxPriorityFeePerGas).toBeDefined();
    expect(userOp.nonce).toBeDefined();
    expect(userOp.paymasterAndData).toBeDefined();
    expect(userOp.sender).toBeDefined();
    expect(userOp.signature).toBeDefined();
    expect(userOp.verificationGasLimit).toBeDefined();
  });
});
