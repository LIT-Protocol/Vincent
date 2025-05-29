import { mcp } from '@lit-protocol/vincent-sdk';
import fs from 'node:fs/promises';

const { VincentAppDefSchema } = mcp;

export async function getVincentAppDef(appId: string, appVersion: string) {
  const vincentAppDefLocation = `${process.cwd()}/src/appDefinitions/${appId}/${appVersion}.json`;

  const vincentAppJson = await fs.readFile(vincentAppDefLocation, { encoding: 'utf8' });
  return VincentAppDefSchema.parse(JSON.parse(vincentAppJson));
}
