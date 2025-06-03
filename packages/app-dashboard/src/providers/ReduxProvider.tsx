import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { baseVincentRtkApi } from '@/components/app-dashboard/mock-forms/baseVincentRtkApi';

// Configure the Redux store with the Vincent API
const store = configureStore({
  reducer: {
    [baseVincentRtkApi.reducerPath]: baseVincentRtkApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseVincentRtkApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default function ReduxProvider({ children }: { children: ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
