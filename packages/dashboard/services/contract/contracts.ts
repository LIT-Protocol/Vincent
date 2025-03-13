import { getContract, Network } from './config';

export interface VincentContractsConfig {
  network?: Network;
}

export class VincentContracts {
  private network: Network;

  constructor(network: Network) {
    this.network = network;
  }

  // ------------------------------------------------------------ Write functions

  async registerApp(
    appName: string,
    appDescription: string,
    authorizedDomains: any,
    authorizedRedirectUris: any,
    delegatees: any
  ) {
    const contract = await getContract(this.network, 'App');
    const tx = await contract.registerApp(
      appName,
      appDescription,
      authorizedDomains,
      authorizedRedirectUris,
      delegatees
    );
    await tx.wait();
    return tx;
  }

  async addDelegatee(appId: number, delegatee: string) {
    const contract = await getContract(this.network, 'App', true);
    const tx = await contract.addDelegatee(appId, delegatee);
    await tx.wait();
    return tx;
  }

  async removeDelegatee(appId: number, delegatee: string) {
    const contract = await getContract(this.network, 'App', true);
    const tx = await contract.removeDelegatee(appId, delegatee);
    await tx.wait();
    return tx;
  }

  async registerNextAppVersion(
    appId: number,
    toolIpfsCids: string[],
    toolPolicies: string[][],
    toolPolicyParameterNames: string[][][]
  ) {
    const contract = await getContract(this.network, 'App', true);
    const tx = await contract.registerNextAppVersion(
      appId,
      toolIpfsCids,
      toolPolicies,
      toolPolicyParameterNames
    );
    await tx.wait();
    return tx;
  }

  // ------------------------------------------------------------ Read functions

  async fetchDelegatedAgentPKPs(appId: number, version: number) {
    const contract = await getContract(this.network, 'AppView');
    const appView = await contract.getAppVersion(appId, version);
    return appView.delegatedAgentPkpTokenIds;
  }

  async getAppsByManager(manager: string) {
    const contract = await getContract(this.network, 'App');
    const apps = await contract.getAppsByManager(manager);
    return apps;
  }

  async getAppById(appId: number) {
    const contract = await getContract(this.network, 'App');
    const app = await contract.getAppById(appId);
    return app;
  }
}
