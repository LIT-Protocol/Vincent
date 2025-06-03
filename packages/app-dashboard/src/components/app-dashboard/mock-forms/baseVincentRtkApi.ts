// Empty API that will be extended with the generated endpoints
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const baseVincentRtkApi = createApi({
  reducerPath: 'vincentApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://staging.registry.heyvincent.ai/' }),
  endpoints: () => ({}),
});
