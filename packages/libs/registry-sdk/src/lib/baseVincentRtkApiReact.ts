// Empty API that will be extended with the generated endpoints
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const baseVincentRtkApiReact = createApi({
  reducerPath: 'vincentApi',
  baseQuery: fetchBaseQuery({ baseUrl: '' }),
  endpoints: () => ({}),
});
