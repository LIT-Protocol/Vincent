import type { OutputBundle, PluginContext } from 'rollup';

import { HANDLER_CHUNK_ID } from '../constants';
import { getLitBundleContext } from '../litBundleContext';

export function getCompiledHandlerCode(rollupPluginContext: PluginContext, bundle: OutputBundle) {
  const ctx = getLitBundleContext(rollupPluginContext);

  const fileId = ctx.chunkIds[HANDLER_CHUNK_ID];
  const fileName = rollupPluginContext.getFileName(fileId);

  const chunk = bundle[fileName];

  if (!chunk || chunk.type !== 'chunk')
    rollupPluginContext.error(`Chunk not found for ${fileName}`);

  return { chunk, fileName };
}
