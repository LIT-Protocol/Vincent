import { IRelayPKP } from '@lit-protocol/types';

export type ApprovalStep = 'minted' | 'actions';

export interface ApprovalState {
  pkp: IRelayPKP;
  lastCompletedStep: ApprovalStep | null;
}

const STORAGE_KEY_PREFIX = 'approval-';

function getKey(appId: number): string {
  return `${STORAGE_KEY_PREFIX}${appId}`;
}

function saveApprovalState(appId: number, state: ApprovalState): void {
  const key = getKey(appId);
  localStorage.setItem(key, JSON.stringify(state));
}

export function getApprovalState(appId: number): ApprovalState | null {
  try {
    const key = getKey(appId);
    const stateStr = localStorage.getItem(key);

    if (!stateStr) {
      return null;
    }

    const state = JSON.parse(stateStr) as ApprovalState;
    return state;
  } catch (error) {
    // This isn't a breaking issue, it just means a new PKP will be minted
    console.error('Failed to retrieve approval state:', error);
    return null;
  }
}

export function updateApprovalStep(appId: number, step: ApprovalStep): void {
  const currentState = getApprovalState(appId);
  if (currentState) {
    currentState.lastCompletedStep = step;
    saveApprovalState(appId, currentState);
  }
}

export function clearApprovalState(appId: number): void {
  const key = getKey(appId);
  localStorage.removeItem(key);
}

export function savePkpToApprovalState(appId: number, pkp: IRelayPKP): void {
  const state: ApprovalState = {
    pkp,
    lastCompletedStep: 'minted',
  };
  saveApprovalState(appId, state);
}
