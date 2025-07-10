import { nodeClient } from '@lit-protocol/vincent-registry-sdk';
import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';

import { env } from './env';

const { VINCENT_REGISTRY_URL } = env;
const { vincentApiClientNode, setBaseQueryFn } = nodeClient;

setBaseQueryFn(fetchBaseQuery({ baseUrl: VINCENT_REGISTRY_URL }));

export const store = configureStore({
  reducer: {
    vincentApi: vincentApiClientNode.reducer,
  },
  middleware: (gdm) => gdm().concat(vincentApiClientNode.middleware),
});
