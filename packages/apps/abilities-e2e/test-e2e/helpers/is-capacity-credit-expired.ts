export function isCapacityCreditExpired(
  mintedAtUtc: string,
  daysUntilUTCMidnightExpiration: number,
): boolean {
  // Create dates from UTC timestamps
  const now = new Date();
  const mintedDate = new Date(mintedAtUtc);

  // Calculate the expiration date at UTC midnight
  const expirationDate = new Date(mintedDate);
  expirationDate.setUTCDate(mintedDate.getUTCDate() + daysUntilUTCMidnightExpiration);
  expirationDate.setUTCHours(0, 0, 0, 0); // Set to UTC midnight

  // Expire 10 minutes before UTC midnight
  const earlyExpirationMinutes = 10;
  const earlyExpirationMilliseconds = earlyExpirationMinutes * 60 * 1000;

  // Compare timestamps in UTC
  return now.getTime() > expirationDate.getTime() - earlyExpirationMilliseconds;
}
