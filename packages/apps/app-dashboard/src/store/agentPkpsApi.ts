import { createApi } from '@reduxjs/toolkit/query/react';
import { getAgentPkps } from '@/utils/user-dashboard/getAgentPkps';
import type { AgentPkpsResult, AgentAppPermission } from '@/utils/user-dashboard/getAgentPkps';

export const agentPkpsApi = createApi({
  reducerPath: 'agentPkpsApi',
  baseQuery: async () => ({ data: null }), // Dummy base query since we only use queryFn
  tagTypes: ['AgentPkps'],
  keepUnusedDataFor: 5, // 5 seconds - replaces manual cache
  endpoints: (builder) => ({
    getAgentPkps: builder.query<AgentPkpsResult, string>({
      queryFn: async (userAddress) => {
        try {
          const result = await getAgentPkps(userAddress);
          return { data: result };
        } catch (error) {
          return {
            error: {
              status: 'FETCH_ERROR',
              error: error instanceof Error ? error.message : 'Failed to fetch agent PKPs',
            },
          };
        }
      },
      providesTags: (_, __, userAddress) => [{ type: 'AgentPkps', id: userAddress }],
    }),
    getPermittedAgentApps: builder.query<AgentAppPermission[], string>({
      queryFn: async (userAddress) => {
        try {
          const result = await getAgentPkps(userAddress);
          return { data: result.permitted };
        } catch (error) {
          return {
            error: {
              status: 'FETCH_ERROR',
              error:
                error instanceof Error ? error.message : 'Failed to fetch permitted agent apps',
            },
          };
        }
      },
      providesTags: (_, __, userAddress) => [{ type: 'AgentPkps', id: `${userAddress}-permitted` }],
    }),
    getUnpermittedAgentApps: builder.query<AgentAppPermission[], string>({
      queryFn: async (userAddress) => {
        try {
          const result = await getAgentPkps(userAddress);
          return { data: result.unpermitted };
        } catch (error) {
          return {
            error: {
              status: 'FETCH_ERROR',
              error:
                error instanceof Error ? error.message : 'Failed to fetch unpermitted agent apps',
            },
          };
        }
      },
      providesTags: (_, __, userAddress) => [
        { type: 'AgentPkps', id: `${userAddress}-unpermitted` },
      ],
    }),
    invalidateAgentPkpsCache: builder.mutation<null, string | void>({
      queryFn: () => ({ data: null }),
      invalidatesTags: (_, __, userAddress) =>
        userAddress 
          ? [
              { type: 'AgentPkps', id: userAddress },
              { type: 'AgentPkps', id: `${userAddress}-permitted` },
              { type: 'AgentPkps', id: `${userAddress}-unpermitted` }
            ]
          : [{ type: 'AgentPkps' }],
    }),
  }),
});

export const {
  useGetAgentPkpsQuery,
  useGetPermittedAgentAppsQuery,
  useInvalidateAgentPkpsCacheMutation,
} = agentPkpsApi;
