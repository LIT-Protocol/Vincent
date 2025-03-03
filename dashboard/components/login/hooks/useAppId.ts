import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppIdState {
  appId: string;
  setAppId: (id: string) => void;
}

export const useAppId = create<AppIdState>()(
  persist(
    (set) => ({
      appId: '123',
      setAppId: (id: string) => {
        if (id === '123' || id === '456') {
          set({ appId: id });
        }
      },
    }),
    {
      name: 'app-id-storage',
    }
  )
); 