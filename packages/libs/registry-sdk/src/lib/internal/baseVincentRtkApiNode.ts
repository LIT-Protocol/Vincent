import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query';
import { tagTypes } from './tags';

let baseQueryFn: BaseQueryFn = () => {
  throw new Error('You must call `setBaseQueryFn` before you can use the vincent RTK client.');
};

export const setBaseQueryFn = (baseQuery: BaseQueryFn) => {
  baseQueryFn = baseQuery;
};

export const baseVincentRtkApiNode = createApi({
  reducerPath: 'vincentApi',
  baseQuery: (...args) => baseQueryFn(...args),
  endpoints: () => ({}),
  tagTypes,
});
