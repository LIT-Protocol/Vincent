const { execSync } = require(`child_process`);
const { join } = require(`path`);
function cleanWorkspace() {
  const rootDir = process.cwd();

  // Reset Nx cache
  try {
    execSync('nx reset', { stdio: 'inherit' });
    console.log('✅ Reset Nx cache');
  } catch (error) {
    console.error('❌ Failed to reset Nx cache:', error.message);
  }

  const paths = [
    join(rootDir, `node_modules`),
    join(rootDir, `bun.lock`),
    join(rootDir, `packages/*/node_modules`),
    join(rootDir, `packages/*/dist`),
    join(rootDir, `packages/vincent-tools/*/node_modules`),
    join(rootDir, `packages/vincent-tools/*/dist`),
  ];
  paths.forEach((path) => {
    try {
      execSync(`rm -rf ${path}`);
      console.log(`✅ Cleaned ${path}`);
    } catch (error) {
      console.error(`❌ Failed to clean ${path}:`, error.message);
    }
  });
}
cleanWorkspace();
