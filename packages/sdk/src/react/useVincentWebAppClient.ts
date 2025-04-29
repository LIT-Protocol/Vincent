import { useState } from 'react';

import { getVincentWebAppClient } from '../app';

export const useVincentWebAppClient = (appId: string) => {
  const [vincentWebAppClient] = useState(() => getVincentWebAppClient({ appId }));

  return vincentWebAppClient;
};
