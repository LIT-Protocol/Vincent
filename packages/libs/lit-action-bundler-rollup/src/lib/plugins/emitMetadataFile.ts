// src/lib/plugins/emitMetadataFile.ts

import type { Plugin } from 'rollup';

import fs from 'fs';
// @ts-expect-error No types for this pkg
import ipfsOnlyHash from 'ipfs-only-hash';
import path from 'path';

import { getCompiledHandlerCode } from './utils';

export function emitMetadataFile({
  outputDir,
  sourceFileName,
}: {
  outputDir: string;
  sourceFileName: string;
}): Plugin {
  return {
    async generateBundle(_, bundle) {
      this.info({ message: 'Emitting JSON metadata file...' });

      const { chunk, fileName } = getCompiledHandlerCode(this, bundle);

      this.info({ message: 'Computing IPFS CID for LA handler code', meta: { fileName } });

      const ipfsCid = await ipfsOnlyHash.of(chunk.code);
      const metadataPath = path.join(outputDir, `${sourceFileName}-metadata.json`);

      this.info({
        message: 'Writing metadata JSON file',
        meta: { fileName, ipfsCid, metadataPath },
      });

      fs.writeFileSync(metadataPath, JSON.stringify({ ipfsCid }, null, 2));
    },
    name: 'metadata-json-file-generator',
  };
}
