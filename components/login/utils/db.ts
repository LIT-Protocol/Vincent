import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface AppMetadata {
  name: string;
  description: string;
}

export interface PolicyInfo {
  id: string;
  description: string;
}

export interface AppInfo {
  id: number;
  appId: string;
  appManagementAddress: string;
  verified: boolean;
  tools: string[];
  policies: PolicyInfo[];
  metadata: AppMetadata;
  supportEmail: string;
  appLogo?: string;
  defaultPrefixes: string[];
  toolId: string;
}

interface LitConsentDB extends DBSchema {
  apps: {
    key: number;
    value: AppInfo;
    indexes: {
      'by-app-id': string;
      'by-address': string;
    };
  };
}

const DB_NAME = 'lit-consent-db';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<LitConsentDB>> | null = null;

export async function initDB(): Promise<IDBPDatabase<LitConsentDB>> {
  if (!dbPromise) {
    console.log('Opening new database connection...');
    dbPromise = openDB<LitConsentDB>(DB_NAME, DB_VERSION, {
      upgrade(db: IDBPDatabase<LitConsentDB>, oldVersion, newVersion) {
        console.log('Upgrading database from version', oldVersion, 'to', newVersion);
        // Delete existing store if it exists
        if (db.objectStoreNames.contains('apps')) {
          db.deleteObjectStore('apps');
        }
        
        const store = db.createObjectStore('apps', {
          keyPath: 'id',
          autoIncrement: true,
        });
        
        // Create indexes for quick lookups
        store.createIndex('by-app-id', 'appId', { unique: true });
        store.createIndex('by-address', 'appManagementAddress', { unique: true });
        console.log('Database upgrade complete');
      },
    });
  }
  return dbPromise;
}

// Database operations
export async function addApp(app: Omit<AppInfo, 'id'>): Promise<number> {
  console.log('Adding app:', app);
  const db = await initDB();
  const id = await db.add('apps', app as AppInfo);
  console.log('App added with id:', id);
  return id;
}

export async function updateApp(id: number, app: Partial<AppInfo>): Promise<void> {
  const db = await initDB();
  const existingApp = await db.get('apps', id);
  if (!existingApp) {
    throw new Error('App not found');
  }
  await db.put('apps', { ...existingApp, ...app });
}

export async function getAppById(id: number): Promise<AppInfo | undefined> {
  const db = await initDB();
  return db.get('apps', id);
}

export async function getAppByAppId(appId: string): Promise<AppInfo | undefined> {
  console.log('Getting app by appId:', appId);
  const db = await initDB();
  const app = await db.getFromIndex('apps', 'by-app-id', appId);
  console.log('Found app:', app);
  return app;
}

export async function getAppByAddress(address: string): Promise<AppInfo | undefined> {
  const db = await initDB();
  return db.getFromIndex('apps', 'by-address', address);
}

export async function getAllApps(): Promise<AppInfo[]> {
  const db = await initDB();
  return db.getAll('apps');
}

export async function deleteApp(id: number): Promise<void> {
  const db = await initDB();
  await db.delete('apps', id);
}

// Debug function to verify database contents
export async function verifyDatabaseContents(): Promise<void> {
  const db = await initDB();
  const apps = await db.getAll('apps');
  console.log('Current database contents:', JSON.stringify(apps, null, 2));
}

// Example app data for testing
export const exampleApps: Omit<AppInfo, 'id'>[] = [
  {
    appId: '123',
    appManagementAddress: '0x1582F4E36154f2EC442a2B3425d4C2520704096E',
    verified: true,
    tools: [
      'Sign messages using your PKP through the specified delegatee address',
      'Only sign messages that start with the allowed prefixes',
      'Use the message signing tool with the given constraints'
    ],
    policies: [
      {
        id: 'QmVCmseCqcfyH9inDHBLMvkqeGohH3U7i8swiVKcyRMGBC',
        description: 'Only sign messages with approved prefixes'
      }
    ],
    metadata: {
      name: 'PKP Consent for App 123',
      description: 'You are permitting App 123 to:'
    },
    supportEmail: 'support@lit.protocol',
    appLogo: 'https://litprotocol.com/lit-logo.png',
    defaultPrefixes: ['hello', 'hi'],
    toolId: 'QmbsiG3mZmgcJteVx6w3dstCzgunxgMUpcic4kZCVgxAz8'
  },
  {
    appId: '456',
    appManagementAddress: '0x2692f4e36154f2ec442a2b3425d4c2520704096f',
    verified: true,
    tools: [
      'Sign messages using your Agent Wallet',
      'Only sign messages that start with the allowed prefixes',
    ],
    policies: [
      {
        id: 'QmWDmseCqcfyH9inDHBLMvkqeGohH3U7i8swiVKcyRMGBC',
        description: 'Only sign messages with approved prefixes'
      }
    ],
    metadata: {
      name: 'Uniswap Agent',
      description: 'You are permitting Uniswap Agent to:'
    },
    supportEmail: 'support@uniswap.org',
    appLogo: 'https://i.imgur.com/pFnokNh.png',
    defaultPrefixes: ['start', 'begin'],
    toolId: 'QmcsiG3mZmgcJteVx6w3dstCzgunxgMUpcic4kZCVgxAz8'
  }
]; 