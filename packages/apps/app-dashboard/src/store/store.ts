import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { reactClient } from '@lit-protocol/vincent-registry-sdk';
import { getCurrentSIWETokenForStore } from '@/hooks/developer-dashboard/useVincentApiWithSIWE';

const { vincentApiClientReact, setBaseQueryFn }: any = reactClient;

// Create a wrapper function that adds PKP-based SIWE authentication headers to mutation requests
const createWithPKPAuth = (baseQuery: any) => {
  return async (args: any, api: any, extraOptions: any) => {
    // Check if this is a mutation request (has a method other than GET or undefined)
    const isMutation =
      args && typeof args === 'object' && 'method' in args && args.method && args.method !== 'GET';

    // If it's a mutation, add the PKP-based SIWE authentication header
    if (isMutation) {
      const siweToken = await getCurrentSIWETokenForStore();

      if (!siweToken) {
        // No valid token, don't make the request
        return {
          error: {
            status: 401,
            data: { message: 'Authentication required. Please authenticate with PKP.' },
          },
        };
      }

      // Add the authorization header to the request
      args = {
        ...args,
        headers: {
          ...args.headers,
          authorization: `SIWE ${siweToken}`,
        },
      };
    }

    // Pass the request to the original fetchBaseQuery function
    return baseQuery(args, api, extraOptions);
  };
};

// Configure the base query function with PKP-based SIWE authentication
setBaseQueryFn(
  createWithPKPAuth(fetchBaseQuery({ baseUrl: `https://staging.registry.heyvincent.ai` })),
);

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
