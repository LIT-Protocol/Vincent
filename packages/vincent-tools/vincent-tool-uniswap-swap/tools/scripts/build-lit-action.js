const esbuild = require('esbuild');
const path = require('path');
const networks = require('../config/networks');

async function buildFile(entryPoint, outfile, network, config) {
  try {
    await esbuild.build({
      entryPoints: [entryPoint],
      bundle: true,
      minify: true,
      format: 'iife',
      globalName: 'LitAction',
      outfile,
      define: {
        'process.env.NETWORK': `"${network}"`,
        LIT_NETWORK: `"${network}"`,
        VINCENT_ADDRESS: `"${config.vincentAddress}"`,
        SPENDING_LIMIT_ADDRESS: `"${config.spendingLimitAddress}"`,
        // ethers: '{}',
      },
      target: ['es2020'],
    });
    console.log(`Successfully built ${path.basename(entryPoint)} for network: ${network}`);
  } catch (error) {
    console.error(`Error building ${path.basename(entryPoint)}:`, error);
    process.exit(1);
  }
}

async function buildAction(network) {
  const config = networks[network];
  const toolEntryPoint = path.resolve(__dirname, '../../src/lib/lit-actions/tool.ts');
  const spendingLimitPolicyEntryPoint = path.resolve(
    __dirname,
    '../../src/lib/lit-actions/spending-limit-policy.ts',
  );
  const erc20ApprovalEntryPoint = path.resolve(
    __dirname,
    '../../src/lib/lit-actions/erc20-approval.ts',
  );

  const toolOutfile = path.resolve(
    __dirname,
    '../../dist',
    `deployed-lit-action-uniswap-swap-tool-${network}.js`,
  );
  const spendingLimitPolicyOutfile = path.resolve(
    __dirname,
    '../../dist',
    `deployed-lit-action-spending-limit-policy-${network}.js`,
  );
  const erc20ApprovalOutfile = path.resolve(
    __dirname,
    '../../dist',
    `deployed-lit-action-erc20-approval-${network}.js`,
  );

  await Promise.all([
    buildFile(toolEntryPoint, toolOutfile, network, config),
    buildFile(spendingLimitPolicyEntryPoint, spendingLimitPolicyOutfile, network, config),
    buildFile(erc20ApprovalEntryPoint, erc20ApprovalOutfile, network, config),
  ]);
}

// Build for each network
Promise.all([buildAction('datil')]).catch(() => process.exit(1));
