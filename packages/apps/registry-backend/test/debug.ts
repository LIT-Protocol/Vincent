import { createDebugger } from '../debug';

// Create a test debug logger that extends the root debug logger
export const testDebug = createDebugger('test');

/**
 * Creates a child debug instance for a specific test file
 * @param filename - The name of the test file (without the .ts extension)
 * @returns A debug instance with the namespace 'vincent-registry:test:<filename>'
 */
export function createTestDebugger(filename: string) {
  return testDebug.extend(filename);
}
