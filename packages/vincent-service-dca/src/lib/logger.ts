export class Logger {
  private isDebugMode: boolean;

  constructor(debug = false) {
    this.isDebugMode = debug;
  }

  debug(...args: any[]) {
    if (this.isDebugMode) {
      console.log(...args);
    }
  }

  error(...args: any[]) {
    console.error(...args);
  }

  setDebugMode(debug: boolean) {
    this.isDebugMode = debug;
  }
}

// Export a singleton instance
export const logger = new Logger();
