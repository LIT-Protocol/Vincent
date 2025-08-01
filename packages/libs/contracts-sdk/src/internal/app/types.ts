import type {
  AddDelegateeParams,
  DeleteAppParams,
  EnableAppVersionParams,
  GetAppByDelegateeParams,
  GetAppByIdParams,
  GetAppsByManagerParams,
  GetAppVersionParams,
  GetDelegatedPkpEthAddressesParams,
  RegisterAppParams,
  RegisterNextVersionParams,
  RemoveDelegateeParams,
  UndeleteAppParams,
} from '../../types';
import type { BaseOptions, BaseWritableOptions } from '../types/options';

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface RegisterAppOptions extends BaseWritableOptions {
  args: RegisterAppParams;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface RegisterNextVersionOptions extends BaseWritableOptions {
  args: RegisterNextVersionParams;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface EnableAppVersionOptions extends BaseWritableOptions {
  args: EnableAppVersionParams;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface AddDelegateeOptions extends BaseWritableOptions {
  args: AddDelegateeParams;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface RemoveDelegateeOptions extends BaseWritableOptions {
  args: RemoveDelegateeParams;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface DeleteAppOptions extends BaseWritableOptions {
  args: DeleteAppParams;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface UndeleteAppOptions extends BaseWritableOptions {
  args: UndeleteAppParams;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface GetAppByIdOptions extends BaseOptions {
  args: GetAppByIdParams;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface GetAppVersionOptions extends BaseOptions {
  args: GetAppVersionParams;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface GetAppsByManagerOptions extends BaseOptions {
  args: GetAppsByManagerParams;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface GetAppByDelegateeOptions extends BaseOptions {
  args: GetAppByDelegateeParams;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface GetDelegatedPkpEthAddressesOptions extends BaseOptions {
  args: GetDelegatedPkpEthAddressesParams;
}
