// Empty API that will be extended with the generated endpoints
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query';

export const baseVincentRtkApiNode = createApi({
  reducerPath: 'vincentApi',
  baseQuery: fetchBaseQuery({ baseUrl: '' }),
  endpoints: () => ({}),
});
