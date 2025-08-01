import type { Contract, Overrides } from 'ethers';

/**
 * @property contract - Vincent delegation contract instance
 */
export interface BaseOptions {
  contract: Contract;
}

/**
 * @property overrides - Optional ethers.Override params for the transaction call (like manual gas limit)
 */
export interface BaseWritableOptions extends BaseOptions {
  overrides?: Overrides;
}
