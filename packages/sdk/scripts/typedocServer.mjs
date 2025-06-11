import * as liveServer from 'live-server';
import { execSync } from 'child_process';
import { watch } from 'fs';

function generateDocs() {
  execSync('pnpm typedoc', { stdio: 'inherit' });
}

generateDocs();

const docsDir = './docs';
watch(docsDir, { recursive: true }, (eventType, filename) => {
  generateDocs();
});

const params = {
  port: 8181, // Set the server port. Defaults to 8080.
  host: '0.0.0.0', // Set the address to bind to. Defaults to 0.0.0.0 or process.env.IP.
  root: './sdk-docs', // Set root directory that's being served. Defaults to cwd.
  open: true, // When false, it won't load your browser by default.
  file: 'index.html', // When set, serve this file (server root relative) for every 404 (useful for single-page applications)
  wait: 250, // Waits for all changes, before reloading. Defaults to 0 sec.
  logLevel: 2, // 0 = errors only, 1 = some, 2 = lots
};

liveServer.default.start(params);
