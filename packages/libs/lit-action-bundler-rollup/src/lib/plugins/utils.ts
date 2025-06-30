import type { OutputBundle, OutputChunk, PluginContext } from 'rollup';

import type { LitBundleContext } from './createLitBundleContext';

import { HANDLER_CHUNK_ID } from '../constants';

interface CompiledHandlerCode {
  bundle: OutputBundle;
  ctx: LitBundleContext;
  pluginContext: PluginContext;
}

export function getCompiledHandlerCode({ bundle, ctx, pluginContext }: CompiledHandlerCode): {
  chunk: OutputChunk;
  fileName: string;
} {
  console.log('getCompiledHandlerCode');
  console.log('got ctx', ctx);
  const fileId = ctx.chunkIds[HANDLER_CHUNK_ID];
  const fileName = pluginContext.getFileName(fileId);

  const chunk = bundle[fileName];
  assertIsChunkType(chunk, pluginContext, fileName);

  return { chunk, fileName };
}
function assertIsChunkType(
  chunk: unknown,
  pluginContext: PluginContext,
  fileName: string,
): asserts chunk is OutputChunk {
  // @ts-expect-error It's an assert func :P
  if (!chunk || chunk.type !== 'chunk') {
    pluginContext.error(`Chunk not found for ${fileName}`);
    // @ts-expect-error Assert funcs.
    throw new Error(`Expected chunk to be of type 'chunk', but got ${chunk.type ?? 'undefined'}`);
  }
}
