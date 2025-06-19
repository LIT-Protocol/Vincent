import { createContext, useContext, ReactNode } from 'react';
import { useParams } from 'react-router';
import { useAppData } from '@/hooks/app-dashboard';
import { useViewType } from '@/hooks/app-dashboard/useViewType';

interface AppDetailContextType {
  appId: number;
  app: any;
  appError: any;
  appLoading: boolean;
  versions: any[] | undefined;
  versionsError: any;
  versionsLoading: boolean;
  versionData: any;
  versionError: any;
  versionLoading: boolean;
  viewType: any;
  versionId: number | null;
}

const AppDetailContext = createContext<AppDetailContextType | null>(null);

export const useAppDetail = () => {
  const context = useContext(AppDetailContext);
  if (!context) {
    throw new Error('useAppDetail must be used within AppDetailProvider');
  }
  return context;
};

export function AppDetailProvider({ children }: { children: ReactNode }) {
  const params = useParams();

  if (!params.appId || isNaN(parseInt(params.appId))) {
    throw new Error('Invalid app ID');
  }

  const appId = parseInt(params.appId);
  const { viewType, versionId } = useViewType();

  const {
    app,
    appError,
    appLoading,
    versions,
    versionsError,
    versionsLoading,
    versionData,
    versionError,
    versionLoading,
  } = useAppData({ appId, viewType, versionId });

  const value: AppDetailContextType = {
    appId,
    app,
    appError,
    appLoading,
    versions,
    versionsError,
    versionsLoading,
    versionData,
    versionError,
    versionLoading,
    viewType,
    versionId,
  };

  return <AppDetailContext.Provider value={value}>{children}</AppDetailContext.Provider>;
}
