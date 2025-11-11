export async function getHyperliquidNonce() {
  const nonceResponse = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'HyperLiquidWithdrawNonce' },
    async () => {
      return Date.now().toString();
    },
  );
  return parseInt(nonceResponse);
}
