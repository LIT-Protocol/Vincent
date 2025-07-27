import crypto from 'crypto';
import os from 'os';

import type { LitNamespace } from '../../lib/litActionHandler/Lit';

declare const Lit: typeof LitNamespace;

export async function myLitAction({ wat }: { wat: string }) {
  console.log('Hello world');

  console.log('wat?', wat);

  console.log('Global Buffer', typeof Buffer);
  console.log('Node os import', typeof os);
  console.log('Node crypto import', typeof crypto);
  console.log('Node webcrypto', typeof crypto.webcrypto);

  const yellowstoneUrl = await Lit.Actions.getRpcUrl({ chain: 'yellowstone' });
  console.log('Yellowstone RPC URL', yellowstoneUrl);

  return { great: 'success, yo' };
}
