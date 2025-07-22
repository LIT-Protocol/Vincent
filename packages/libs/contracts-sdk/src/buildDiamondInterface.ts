import type { JsonFragment } from '@ethersproject/abi';

import { Interface, Fragment } from 'ethers/lib/utils';

/**
 * Deduplicates ABI entries using canonical fragment signatures.
 */
function dedupeAbiFragments(abis: ReadonlyArray<JsonFragment | string>): JsonFragment[] {
  const seen = new Set<string>();
  const deduped: JsonFragment[] = [];

  for (const entry of abis) {
    try {
      const fragment = Fragment.from(entry);
      const signature = fragment.format(); // canonical signature

      if (!seen.has(signature)) {
        seen.add(signature);

        const jsonFragment =
          typeof entry === 'string' ? JSON.parse(fragment.format('json')) : entry; // already a JsonFragment

        deduped.push(jsonFragment as JsonFragment);
      }
    } catch {
      // fallback for malformed entries
      const fallbackKey = typeof entry === 'string' ? entry : JSON.stringify(entry);
      if (!seen.has(fallbackKey)) {
        seen.add(fallbackKey);
        deduped.push(entry as JsonFragment);
      }
    }
  }

  return deduped;
}

/**
 * Builds a deduplicated Interface from multiple facet ABIs in a Diamond.
 * @param facets Array of facet ABIs (or raw fragments)
 */
export function buildDiamondInterface(
  facets: ReadonlyArray<ReadonlyArray<JsonFragment | string>>,
): Interface {
  const flattened = facets.flat();
  const deduped = dedupeAbiFragments(flattened);
  return new Interface(deduped);
}
