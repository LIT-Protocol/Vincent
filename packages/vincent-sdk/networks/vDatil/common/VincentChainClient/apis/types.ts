import { Hex, TransactionReceipt } from 'viem';
import { DecodedLog } from './utils/decodeVincentLogs';

export type VincentTxRes<T> = {
  hash: Hex;
  receipt: TransactionReceipt;
  decodedLogs: DecodedLog[];
  data: T;
};

export type VincentTxVoid = {
  hash: Hex;
  receipt: TransactionReceipt;
  decodedLogs: DecodedLog[];
};
