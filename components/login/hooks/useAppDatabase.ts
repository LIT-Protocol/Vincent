import { useState, useEffect, useCallback } from 'react';
import { AppInfo, initDB, addApp, updateApp, getAppById, getAppByAppId, getAllApps, deleteApp, exampleApps } from '../utils/db';

// Track if we've already initialized the database
let isInitialized = false;

export function useAppDatabase() {
  const [initialized, setInitialized] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize the database and load example data if needed
  useEffect(() => {
    let mounted = true;

    async function init() {
      if (isInitialized) {
        setInitialized(true);
        setInitLoading(false);
        return;
      }

      try {
        console.log('Initializing database...');
        await initDB();
        
        // Get all current apps
        console.log('Getting all apps...');
        const apps = await getAllApps();
        console.log('Current apps:', apps);
        
        // Update or add example apps
        console.log('Loading example apps:', exampleApps);
        for (const exampleApp of exampleApps) {
          const existingApp = apps.find(app => app.appId === exampleApp.appId);
          if (existingApp) {
            // Update existing app
            console.log(`Updating app ${exampleApp.appId}`);
            await updateApp(existingApp.id, exampleApp);
          } else {
            // Add new app
            console.log(`Adding new app ${exampleApp.appId}`);
            const id = await addApp(exampleApp);
            console.log(`Added app with id ${id}`);
          }
        }
        
        isInitialized = true;
        if (mounted) {
          setInitialized(true);
        }
      } catch (err) {
        console.error('Database initialization error:', err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (mounted) {
          setInitLoading(false);
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  const getApplicationByAppId = useCallback(async (appId: string) => {
    if (!initialized || initLoading) return null;
    
    try {
      setOperationLoading(true);
      setError(null);
      console.log('Searching for app with appId:', appId);
      const app = await getAppByAppId(appId);
      console.log('Found app:', app);
      return app;
    } catch (err) {
      console.error('Error getting app by appId:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setOperationLoading(false);
    }
  }, [initialized, initLoading]);

  const addApplication = useCallback(async (app: Omit<AppInfo, 'id'>) => {
    if (!initialized || initLoading) return null;
    
    try {
      setOperationLoading(true);
      setError(null);
      return await addApp(app);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setOperationLoading(false);
    }
  }, [initialized, initLoading]);

  const updateApplication = useCallback(async (id: number, app: Partial<AppInfo>) => {
    if (!initialized || initLoading) return;
    
    try {
      setOperationLoading(true);
      setError(null);
      await updateApp(id, app);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setOperationLoading(false);
    }
  }, [initialized, initLoading]);

  const getAllApplications = useCallback(async () => {
    if (!initialized || initLoading) return [];
    
    try {
      setOperationLoading(true);
      setError(null);
      return await getAllApps();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setOperationLoading(false);
    }
  }, [initialized, initLoading]);

  return {
    initialized,
    loading: initLoading || operationLoading,
    error,
    addApplication,
    updateApplication,
    getApplicationByAppId,
    getAllApplications,
  };
} 