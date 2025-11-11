/**
 * Replace bigint values with strings in JSON.stringify
 * @param key - The key of the value
 * @param value - The value to replace
 * @returns The replaced value
 */
export const bigIntReplacer = (key: string, value: unknown): unknown => {
  return typeof value === 'bigint' ? value.toString() : value;
};
