import { createCrossmint, WalletsApiClient } from '@crossmint/wallets-sdk';

function getCrossmintApiKey(): string {
  const CROSSMINT_API_KEY = process.env.CROSSMINT_API_KEY as string | undefined;
  if (!CROSSMINT_API_KEY) {
    throw new Error('Missing CROSSMINT_API_KEY env variable');
  }
  return CROSSMINT_API_KEY;
}

// Lazy initialization - only validates when accessed
let _crossmintWalletApiClient: WalletsApiClient | null = null;

export function getCrossmintWalletApiClient(): WalletsApiClient {
  if (!_crossmintWalletApiClient) {
    const crossmint = createCrossmint({
      apiKey: getCrossmintApiKey(),
    });
    _crossmintWalletApiClient = new WalletsApiClient(crossmint);
  }
  return _crossmintWalletApiClient;
}
