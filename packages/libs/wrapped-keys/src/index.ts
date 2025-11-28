import type {
  SupportedNetworks,
  StoreKeyParams,
  StoreKeyBatchParams,
} from './lib/service-client/types';
import type {
  GetEncryptedKeyDataParams,
  GeneratePrivateKeyParams,
  GeneratePrivateKeyResult,
  BaseApiParams,
  ApiParamsSupportedNetworks,
  StoreEncryptedKeyParams,
  StoreEncryptedKeyBatchParams,
  StoredKeyData,
  StoredKeyMetadata,
  ListEncryptedKeyMetadataParams,
  StoreEncryptedKeyResult,
  StoreEncryptedKeyBatchResult,
  BatchGeneratePrivateKeysParams,
  BatchGeneratePrivateKeysResult,
  Network,
  KeyType,
  ExportPrivateKeyParams,
  ExportPrivateKeyResult,
} from './lib/types';

import {
  getEncryptedKey,
  generatePrivateKey,
  storeEncryptedKey,
  listEncryptedKeyMetadata,
  batchGeneratePrivateKeys,
  storeEncryptedKeyBatch,
  exportPrivateKey,
} from './lib/api';
import {
  CHAIN_YELLOWSTONE,
  LIT_PREFIX,
  NETWORK_SOLANA,
  KEYTYPE_ED25519,
  WRAPPED_KEYS_JWT_AUDIENCE,
} from './lib/constants';
import { getSolanaKeyPairFromWrappedKey } from './lib/lit-actions-client';

export const constants = {
  CHAIN_YELLOWSTONE,
  LIT_PREFIX,
  NETWORK_SOLANA,
  KEYTYPE_ED25519,
  WRAPPED_KEYS_JWT_AUDIENCE,
};

export const api = {
  generatePrivateKey,
  getEncryptedKey,
  listEncryptedKeyMetadata,
  storeEncryptedKey,
  storeEncryptedKeyBatch,
  batchGeneratePrivateKeys,
  exportPrivateKey,
  litActionHelpers: {
    getSolanaKeyPairFromWrappedKey,
  },
};

export {
  ApiParamsSupportedNetworks,
  BaseApiParams,
  GetEncryptedKeyDataParams,
  GeneratePrivateKeyParams,
  GeneratePrivateKeyResult,
  ListEncryptedKeyMetadataParams,
  StoreEncryptedKeyParams,
  StoreEncryptedKeyResult,
  StoreEncryptedKeyBatchParams,
  StoreEncryptedKeyBatchResult,
  StoredKeyData,
  StoredKeyMetadata,
  SupportedNetworks,
  BatchGeneratePrivateKeysParams,
  BatchGeneratePrivateKeysResult,
  Network,
  KeyType,
  StoreKeyParams,
  StoreKeyBatchParams,
  ExportPrivateKeyParams,
  ExportPrivateKeyResult,
};
