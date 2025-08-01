import { docSchemas } from '@lit-protocol/vincent-registry-sdk';

export type App = typeof docSchemas.appDoc._type;
export type AppVersion = typeof docSchemas.appVersionDoc._type;
export type AppVersionAbility = typeof docSchemas.appVersionAbilityDoc._type;
export type Ability = typeof docSchemas.abilityDoc._type;
export type AbilityVersion = typeof docSchemas.abilityVersionDoc._type;
export type Policy = typeof docSchemas.policyDoc._type;
export type PolicyVersion = typeof docSchemas.policyVersionDoc._type;
