 
import { buildLitAction } from '../lib/esbuild/esbuild';

buildLitAction({
  entryPoint: './lit-action/lit-action.ts',
  tsconfigPath: '../../tsconfig.lib.json',
  outdir: './generated',
});
