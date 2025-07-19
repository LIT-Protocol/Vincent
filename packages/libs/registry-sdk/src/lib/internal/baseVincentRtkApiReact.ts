import type { BaseQueryFn } from '@reduxjs/toolkit/query/react';

// Empty API that will be extended with the generated endpoints
import { createApi } from '@reduxjs/toolkit/query/react';

import { tagTypes } from './tags';

let baseQueryFn: BaseQueryFn = () => {
  throw new Error('You must call `setBaseQueryFn` before you can use the vincent RTK client.');
};

export const setBaseQueryFn = (baseQuery: BaseQueryFn) => {
  baseQueryFn = baseQuery;
};

export const baseVincentRtkApiReact = createApi({
  reducerPath: 'vincentApi',
  baseQuery: (...args) => baseQueryFn(...args),
  endpoints: () => ({}),
  tagTypes,
});
