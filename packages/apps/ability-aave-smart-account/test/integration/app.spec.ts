import { getVincentAbilityClient } from '@lit-protocol/vincent-app-sdk/abilityClient';
import { ethers } from 'ethers';

import { bundledVincentAbility } from '../../src';
import { getAaveAddresses, getAvailableMarkets } from '../../src/lib/helpers/aave';
import { erc20Iface } from '../../src/lib/helpers/erc20';
import { lightIface } from '../../src/lib/helpers/lightAccount';
import { type UserOpv060 } from '../../src/lib/helpers/userOperation';
import {
  CHAIN_ID,
  DELEGATEE_PRIVATE_KEY,
  DELEGATOR_ADDRESS,
  ENTRY_POINT,
  SMART_ACCOUNT_ADDRESS,
  RPC_URL,
} from '../helpers/test-variables';

interface Transaction {
  from: string;
  to: string;
  data: string;
}
type TransactionBundle = [Transaction];

// Extend Jest timeout to 4 minutes
jest.setTimeout(240000);

const delegateeSigner = new ethers.Wallet(
  DELEGATEE_PRIVATE_KEY,
  new ethers.providers.JsonRpcProvider('https://yellowstone-rpc.litprotocol.com'),
);

async function buildTxBundle(
  accountAddress: string,
  assetAddress: string,
  poolAddress: string,
): Promise<TransactionBundle> {
  const approveData = erc20Iface.encodeFunctionData('approve', [poolAddress, '1']);
  const approveTx: Transaction = {
    from: accountAddress,
    to: assetAddress,
    data: approveData,
  };

  return [approveTx];
}

describe('it should create, validate and sign an aave user op', () => {
  it('it should create, validate and sign an aave user op', async () => {
    const abilityClient = getVincentAbilityClient({
      bundledVincentAbility,
      ethersSigner: delegateeSigner,
    });

    // Use helpers to get Aave and USDC addresses
    const { POOL } = getAaveAddresses(CHAIN_ID);

    const markets = getAvailableMarkets(CHAIN_ID);
    const asset = markets['USDC'];
    if (!asset) {
      throw new Error(`USDC not found in Aave markets for chain ${CHAIN_ID}`);
    }

    const txBundle = await buildTxBundle(SMART_ACCOUNT_ADDRESS, asset, POOL);
    const [approveTx] = txBundle;

    // Batched transactions:
    const tos = [approveTx.to];
    const datas = [approveTx.data];
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

    const precheckResult = await abilityClient.precheck(
      {
        userOp: userOpv060,
        entryPointAddress: ENTRY_POINT,
        rpcUrl: RPC_URL,
      },
      {
        delegatorPkpEthAddress: DELEGATOR_ADDRESS,
      },
    );

    expect(precheckResult.success).toBeTruthy();
    expect('runtimeError' in precheckResult).toBeFalsy();
    expect('schemaValidationError' in precheckResult).toBeFalsy();
    expect(precheckResult.success).toBeTruthy();
    expect(precheckResult.result).toBeDefined();

    // @ts-expect-error - can have error or the success fields
    const {
      error: precheckError,
      simulationChanges: precheckSimulationChanges,
      userOp: precheckUserOp,
    } = precheckResult.result;

    // precheckError
    expect(precheckError).toBeUndefined();

    // simulationChanges
    expect(precheckSimulationChanges).toBeDefined();
    expect(precheckSimulationChanges.length).toBe(2);

    // userOp
    expect(precheckUserOp.callData).toBeDefined();
    expect(precheckUserOp.callGasLimit).toBeDefined();
    expect(precheckUserOp.preVerificationGas).toBeDefined();
    expect(precheckUserOp.initCode).toBeDefined();
    expect(precheckUserOp.maxFeePerGas).toBeDefined();
    expect(precheckUserOp.maxPriorityFeePerGas).toBeDefined();
    expect(precheckUserOp.nonce).toBeDefined();
    expect(precheckUserOp.paymasterAndData).toBeDefined();
    expect(precheckUserOp.sender).toBeDefined();
    expect(precheckUserOp.signature).toBeDefined();
    expect(precheckUserOp.verificationGasLimit).toBeDefined();

    const executeResult = await abilityClient.execute(
      {
        userOp: userOpv060, // We could pass precheckUserOp but it's not necessary
        entryPointAddress: ENTRY_POINT,
        rpcUrl: RPC_URL,
      },
      {
        delegatorPkpEthAddress: DELEGATOR_ADDRESS,
      },
    );

    expect(executeResult.success).toBeTruthy();
    expect('runtimeError' in executeResult).toBeFalsy();
    expect('schemaValidationError' in executeResult).toBeFalsy();
    expect(executeResult.success).toBeTruthy();
    expect(executeResult.result).toBeDefined();

    // @ts-expect-error - can have error or the success fields
    const {
      error: executeError,
      simulationChanges: executeSimulationChanges,
      userOp: executeUserOp,
    } = executeResult.result;

    // executeError
    expect(executeError).toBeUndefined();

    // simulationChanges
    expect(executeSimulationChanges).toBeDefined();
    expect(executeSimulationChanges.length).toBe(2);

    // userOp
    expect(executeUserOp.callData).toBeDefined();
    expect(executeUserOp.callGasLimit).toBeDefined();
    expect(executeUserOp.preVerificationGas).toBeDefined();
    expect(executeUserOp.initCode).toBeDefined();
    expect(executeUserOp.maxFeePerGas).toBeDefined();
    expect(executeUserOp.maxPriorityFeePerGas).toBeDefined();
    expect(executeUserOp.nonce).toBeDefined();
    expect(executeUserOp.paymasterAndData).toBeDefined();
    expect(executeUserOp.sender).toBeDefined();
    expect(executeUserOp.verificationGasLimit).toBeDefined();
    // Signature has to be defined but different from the mock one
    expect(executeUserOp.signature).toBeDefined();
    expect(executeUserOp.signature).not.toBe(
      '0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c',
    );
  });
});
