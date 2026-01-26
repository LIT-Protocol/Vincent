// Helper to get required environment variables
export const getEnv = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  if (!process.env[key] && fallback) {
    console.warn(`${key} not set; using fallback value.`);
  }
  return value;
};
