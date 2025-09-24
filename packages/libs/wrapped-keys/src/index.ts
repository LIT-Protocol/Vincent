import type { SupportedNetworks } from './lib/service-client/types';
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
} from './lib/types';

import {
  getEncryptedKey,
  generatePrivateKey,
  storeEncryptedKey,
  listEncryptedKeyMetadata,
  batchGeneratePrivateKeys,
  storeEncryptedKeyBatch,
  getVincentRegistryAccessControlCondition,
} from './lib/api';
import {
  CHAIN_YELLOWSTONE,
  VINCENT_PREFIX,
  NETWORK_SOLANA,
  KEYTYPE_ED25519,
} from './lib/constants';

export const constants = {
  CHAIN_YELLOWSTONE,
  VINCENT_PREFIX,
  NETWORK_SOLANA,
  KEYTYPE_ED25519,
};

export const api = {
  generatePrivateKey,
  getEncryptedKey,
  listEncryptedKeyMetadata,
  storeEncryptedKey,
  storeEncryptedKeyBatch,
  batchGeneratePrivateKeys,
  getVincentRegistryAccessControlCondition,
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
};
