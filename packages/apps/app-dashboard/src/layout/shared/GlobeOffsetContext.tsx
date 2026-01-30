import { createContext, useContext, useState, ReactNode } from 'react';

interface GlobeOffsetContextType {
  shouldOffset: boolean;
  setShouldOffset: (offset: boolean) => void;
}

const GlobeOffsetContext = createContext<GlobeOffsetContextType | null>(null);

export function GlobeOffsetProvider({ children }: { children: ReactNode }) {
  const [shouldOffset, setShouldOffset] = useState(false);

  return (
    <GlobeOffsetContext.Provider value={{ shouldOffset, setShouldOffset }}>
      {children}
    </GlobeOffsetContext.Provider>
  );
}

export function useGlobeOffset() {
  const context = useContext(GlobeOffsetContext);
  if (!context) {
    throw new Error('useGlobeOffset must be used within GlobeOffsetProvider');
  }
  return context;
}
