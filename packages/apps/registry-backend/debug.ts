import debug from 'debug';

// Create the root debug logger with the prefix 'vincent-registry'
export const rootDebug = debug('vincent-registry');

/**
 * Creates a child debug instance with the given namespace
 * @param namespace - The namespace for the child debug instance
 * @returns A debug instance with the namespace 'vincent-registry:<namespace>'
 */
export function createDebugger(namespace: string) {
  return rootDebug.extend(namespace);
}

// Export the debug package for direct use if needed
export { debug };
