import { Ability } from '@/types/developer-dashboard/appTypes';

export type CreateAppStep = 'abilities' | 'delegatees' | 'metadata' | 'review' | 'submitting';

export interface SelectedAbility {
  ability: Ability;
  ipfsCid: string;
  policies: string[];
}

export const CREATE_APP_STORAGE_KEY = 'vincentCreateAppDraft';

export const STEPS = [
  { name: 'Select Abilities', step: 'abilities' },
  { name: 'Add Delegatees', step: 'delegatees' },
  { name: 'App Details', step: 'metadata' },
  { name: 'Review', step: 'review' },
  { name: 'Register', step: 'submitting' },
] as const;
