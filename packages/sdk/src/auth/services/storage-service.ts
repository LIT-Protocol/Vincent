export class Storage {
  private static readonly JWT_KEY = 'vincent_jwt';
  private isBrowser: boolean;

  constructor() {
    this.isBrowser = typeof window !== 'undefined' && window.localStorage !== undefined;
  }

  /**
   * Store a JWT token
   * @param jwt - The JWT string to store
   */
  async storeJWT(jwt: string): Promise<void> {
    if (!this.isBrowser) {
      console.warn('Storage operations are not supported in Node environment');
      return;
    }
    try {
      localStorage.setItem(Storage.JWT_KEY, jwt);
    } catch (error) {
      console.error('Error storing JWT in localStorage:', error);
      throw error;
    }
  }

  /**
   * Retrieve the stored JWT token
   * @returns The stored JWT string or null if not found
   */
  async getJWT(): Promise<string | null> {
    if (!this.isBrowser) {
      console.warn('Storage operations are not supported in Node environment');
      return null;
    }
    try {
      return localStorage.getItem(Storage.JWT_KEY);
    } catch (error) {
      console.error('Error retrieving JWT from localStorage:', error);
      throw error;
    }
  }

  /**
   * Remove the stored JWT token (logout)
   */
  async clearJWT(): Promise<void> {
    if (!this.isBrowser) {
      console.warn('Storage operations are not supported in Node environment');
      return;
    }
    try {
      localStorage.removeItem(Storage.JWT_KEY);
    } catch (error) {
      console.error('Error removing JWT from localStorage:', error);
      throw error;
    }
  }

  /**
   * Clear all stored data
   */
  async clearAll(): Promise<void> {
    if (!this.isBrowser) {
      console.warn('Storage operations are not supported in Node environment');
      return;
    }
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      throw error;
    }
  }
} 