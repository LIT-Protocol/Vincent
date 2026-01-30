import { configureStore, isRejectedWithValue } from '@reduxjs/toolkit';
import type { Middleware } from '@reduxjs/toolkit';
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import * as Sentry from '@sentry/react';
import { reactClient } from '@lit-protocol/vincent-registry-sdk';
import { getSiweAuthToken } from '@/hooks/developer-dashboard/useAuth';
import { registryUrl } from '@/config/registry';

const { vincentApiClientReact, setBaseQueryFn }: any = reactClient;

// Create a wrapper function that adds SIWE authentication headers to mutation requests
const createWithSiweAuth = (baseQuery: any) => {
  return async (args: any, api: any, extraOptions: any) => {
    // Check if this is a mutation request (has a method other than GET or undefined)
    const isMutation =
      args && typeof args === 'object' && 'method' in args && args.method && args.method !== 'GET';

    // If it's a mutation, add the SIWE authentication header
    if (isMutation) {
      const siweToken = getSiweAuthToken();

      if (!siweToken) {
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

      // Add the SIWE authorization header to the request
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

// Configure the base query function with SIWE authentication
setBaseQueryFn(createWithSiweAuth(fetchBaseQuery({ baseUrl: registryUrl })));

/**
 * RTK Query Error Logger Middleware
 * Captures all RTK Query errors and logs them to Sentry
 */
export const rtkQueryErrorLogger: Middleware = () => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    Sentry.captureException(action.payload, {
      extra: {
        context: 'RTK Query Error',
      },
    });
  }

  return next(action);
};

export const store = configureStore({
  reducer: {
    vincentApi: (vincentApiClientReact as any).reducer,
  },
  // Adding the api middleware enables caching, invalidation, polling,
  // and other useful features of `rtk-query`.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat((vincentApiClientReact as any).middleware, rtkQueryErrorLogger),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
