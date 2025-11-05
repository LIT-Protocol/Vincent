export type CapacityToken = {
  URI: { description: string; image_data: string; name: string };
  capacity: {
    expiresAt: { formatted: string; timestamp: number };
    requestsPerMillisecond: number;
  };
  isExpired: boolean;
  tokenId: number;
};
