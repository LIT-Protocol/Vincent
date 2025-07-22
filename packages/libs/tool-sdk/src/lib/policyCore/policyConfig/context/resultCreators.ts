import type {
  ContextAllowResponse,
  ContextAllowResponseNoResult,
  ContextDenyResponse,
  ContextDenyResponseNoResult,
} from './types';

export function createAllow<T>(result: T): ContextAllowResponse<T> {
  return {
    allow: true,
    result,
  } as ContextAllowResponse<T>;
}

export function createAllowNoResult(): ContextAllowResponseNoResult {
  return {
    allow: true,
  } as ContextAllowResponseNoResult;
}

export function createDeny<T>(result: T): ContextDenyResponse<T> {
  return {
    allow: false,
    result,
  } as ContextDenyResponse<T>;
}

export function createDenyNoResult(): ContextDenyResponseNoResult {
  return {
    allow: false,
    result: undefined as never,
  } as ContextDenyResponseNoResult;
}
