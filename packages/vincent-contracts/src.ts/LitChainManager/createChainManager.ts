export function createDatilChainManager(
  network: "datil-dev" | "datil-test" | "datil-mainnet"
){
  switch(network){
    case "datil-mainnet":
      return {
        vincentApi: {
          consentPage: {},
          appManagerDashboard: {},
          toolLitActions: {},
          litManager: {},
          userDashboard: {},
          unknown: {},
        }
      };
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}