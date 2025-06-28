import { docSchemas } from '@lit-protocol/vincent-registry-sdk';

export type App = typeof docSchemas.appDoc._type;
export type AppVersion = typeof docSchemas.appVersionDoc._type;
export type AppVersionTool = typeof docSchemas.appVersionToolDoc._type;
export type Tool = typeof docSchemas.toolDoc._type;
export type ToolVersion = typeof docSchemas.toolVersionDoc._type;
export type Policy = typeof docSchemas.policyDoc._type;
