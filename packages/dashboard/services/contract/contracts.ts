import { getContract, Network } from './config';
import { ethers } from 'ethers';

export interface VincentContractsConfig {
  network?: Network;
  signer?: ethers.Signer;
}

export class VincentContracts {
  private network: Network;
  private signer?: ethers.Signer;

  // Uses browser signer by default
  constructor(network: Network, signer?: ethers.Signer) {
    this.network = network;
    this.signer = signer;
  }

  // ------------------------------------------------------------ Write functions

  async registerApp(
    appName: string,
    appDescription: string,
    authorizedRedirectUris: any,
    delegatees: string[]
  ) {
    const contract = await getContract(this.network, 'App', true, this.signer);
    console.log(contract);
    console.log(appName, appDescription, authorizedRedirectUris, delegatees);
    
    const tx = await contract.registerApp(
      "RedirectUriTesting",
      "Test Description",
      ["http://localhost:3000", "http://localhost:3000/test", "http://localhost:5173", "http://localhost:5173/", "https://my-react-app-liard-beta.vercel.app/", "https://my-react-app-liard-beta.vercel.app"],
      ["0xa723407AdB396a55aCd843D276daEa0d787F8db5"],
      ["QmUT4Ke8cPtJYRZiWrkoG9RZc77hmRETNQjvDYfLtrMUEY", "QmcLbQPohPURMuNdhYYa6wyDp9pm6eHPdHv9TRgFkPVebE"],
      [[""], [""]],
      [[""], [""]],
      [[["param1"]], [["param2"]]],
      {gasLimit: 5000000})
    await tx.wait();
    return tx;
  }

  async addDelegatee(appId: number, delegatee: string) {
    const contract = await getContract(this.network, 'App', true, this.signer);
    const tx = await contract.addDelegatee(appId, delegatee);
    await tx.wait();
    return tx;
  }

  async removeDelegatee(appId: number, delegatee: string) {
    const contract = await getContract(this.network, 'App', true, this.signer);
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
    const contract = await getContract(this.network, 'App', true, this.signer);
    const tx = await contract.registerNextAppVersion(
      appId,
      toolIpfsCids,
      toolPolicies,
      toolPolicyParameterNames
    );
    await tx.wait();
    return tx;
  }

  async enableAppVersion(appId: number, version: number, isEnabled: boolean) {
    const contract = await getContract(this.network, 'App', true, this.signer);
    console.log('appId', appId);
    console.log('version', version);
    console.log('isEnabled', isEnabled);
    const tx = await contract.enableAppVersion(appId, version, isEnabled);
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
    const contract = await getContract(this.network, 'AppView');
    const apps = await contract.getAppsByManager(manager);
    return apps;
  }

  async getAppById(appId: number) {
    const contract = await getContract(this.network, 'AppView');
    const app = await contract.getAppById(appId);
    return app;
  }

  async getAppVersion(appId: number, version: number) {
    const contract = await getContract(this.network, 'AppView');
    const appVersion = await contract.getAppVersion(appId, version);
    return appVersion;
  }
}
