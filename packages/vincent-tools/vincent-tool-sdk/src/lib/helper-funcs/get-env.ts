export const getEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    return undefined;
  }
  return value;
};
