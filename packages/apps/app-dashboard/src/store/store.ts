import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { reactClient } from '@lit-protocol/vincent-registry-sdk';
import { getCurrentJwtTokenForStore } from '@/hooks/developer-dashboard/useVincentApiWithJWT';
import { env } from '@/config/env';

const { VITE_ENV } = env;

const BASE_URL_MAPPING = {
  development: 'http://localhost:3000',
  staging: 'https://staging.registry.heyvincent.ai',
  production: 'https://registry.heyvincent.ai',
};

const BASE_URL = BASE_URL_MAPPING[VITE_ENV as keyof typeof BASE_URL_MAPPING];

const { vincentApiClientReact, setBaseQueryFn }: any = reactClient;

// Create a wrapper function that adds PKP-based SIWE authentication headers to mutation requests
const createWithPKPAuth = (baseQuery: any) => {
  return async (args: any, api: any, extraOptions: any) => {
    // Check if this is a mutation request (has a method other than GET or undefined)
    const isMutation =
      args && typeof args === 'object' && 'method' in args && args.method && args.method !== 'GET';

    // If it's a mutation, add the PKP-based JWT authentication header
    if (isMutation) {
      const jwtToken = await getCurrentJwtTokenForStore();

      if (!jwtToken) {
        // No valid token, don't make the request
        return {
          error: {
            status: 401,
            data: {
              message:
                'Authentication required. Please try refreshing the page, and if the problem persists, please sign in again.',
            },
          },
        };
      }

      // Add the authorization header to the request
      args = {
        ...args,
        headers: {
          ...args.headers,
          authorization: `Bearer ${jwtToken}`,
        },
      };
    }

    // Pass the request to the original fetchBaseQuery function
    return baseQuery(args, api, extraOptions);
  };
};

// Configure the base query function with PKP-based SIWE authentication
setBaseQueryFn(createWithPKPAuth(fetchBaseQuery({ baseUrl: BASE_URL })));

export const store = configureStore({
  reducer: {
    vincentApi: (vincentApiClientReact as any).reducer,
  },
  // Adding the api middleware enables caching, invalidation, polling,
  // and other useful features of `rtk-query`.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat((vincentApiClientReact as any).middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
