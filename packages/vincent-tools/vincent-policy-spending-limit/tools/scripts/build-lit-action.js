const esbuild = require('esbuild');
const path = require('path');

async function buildFile(entryPoint, outfile) {
  try {
    await esbuild.build({
      entryPoints: [entryPoint],
      bundle: true,
      minify: false,
      format: 'iife',
      globalName: 'LitAction',
      outfile,
      target: ['es2020'],
    });
    console.log(`Successfully built ${path.basename(entryPoint)}`);
  } catch (error) {
    console.error(`Error building ${path.basename(entryPoint)}:`, error);
    process.exit(1);
  }
}

async function buildAction() {
  const policyEntryPoint = path.resolve(__dirname, '../../src/lib/vincent-policy.ts');

  const policyOutfile = path.resolve(
    __dirname,
    '../../dist',
    `deployed-lit-action-vincent-policy.js`,
  );

  await buildFile(policyEntryPoint, policyOutfile);
}

// Build for each network
Promise.all([buildAction()]).catch(() => process.exit(1));
