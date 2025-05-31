/**
 * Network configurations for building and deploying Lit Actions
 */
module.exports = {
  datil: {
    vincentAddress: '0x456DFB72AAe179E219FEbf3f339dF412dF30313D',
    spendingLimitAddress: '0x2d043f8c6b80ea6396a51dc6333027fbdb8343a3',
    litNetwork: 'datil',
    outputFiles: [
      'deployed-lit-action-uniswap-swap-tool-datil.js',
      'deployed-lit-action-spending-limit-policy-datil.js',
      'deployed-lit-action-erc20-approval-datil.js',
    ],
  },
};
