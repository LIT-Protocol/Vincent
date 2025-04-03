import { getContract, Network, estimateGasWithBuffer } from './config';
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
    delegatees: string[],
    toolIpfsCids: string[],
    toolPolicies: string[][],
    toolPolicyParameterTypes: number[][][],
    toolPolicyParameterNames: string[][][],
    deploymentStatus: number = 0 // DEV=0, TEST=1, PROD=2
  ) {
    const contract = await getContract(this.network, 'App', true, this.signer);
    console.log("toolpolicyparametertypes", toolPolicyParameterTypes);
    console.log("formatted toolpolicyparametertypes", JSON.stringify(toolPolicyParameterTypes));
    
    // Create tuple arguments as expected by the contract
    const appInfo = {
      name: appName,
      description: appDescription,
      deploymentStatus: deploymentStatus,
      authorizedRedirectUris: authorizedRedirectUris,
      delegatees: delegatees
    };
    
    const versionTools = {
      toolIpfsCids: toolIpfsCids,
      toolPolicies: toolPolicies,
      toolPolicyParameterNames: toolPolicyParameterNames,
      toolPolicyParameterTypes: toolPolicyParameterTypes
    };

    // Use tuple parameters as expected by the contract
    const args = [appInfo, versionTools];

    const gasLimit = await estimateGasWithBuffer(
      contract,
      'registerApp',
      args
    );

    const tx = await contract.registerApp(
      ...args,
      {gasLimit}
    );
      
    await tx.wait();
    return tx;
  }

  async addDelegatee(appId: number, delegatee: string) {
    const contract = await getContract(this.network, 'App', true, this.signer);
    console.log("Trying to add delegatee", appId, delegatee);
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
    toolPolicyParameterTypes: number[][][],
    toolPolicyParameterNames: string[][][]
  ) {
    const contract = await getContract(this.network, 'App', true, this.signer);
    
    // Create the versionTools tuple argument as expected by the contract
    const versionTools = {
      toolIpfsCids: toolIpfsCids,
      toolPolicies: toolPolicies,
      toolPolicyParameterNames: toolPolicyParameterNames,
      toolPolicyParameterTypes: toolPolicyParameterTypes
    };

    // Use tuple parameters as expected by the contract
    const args = [appId, versionTools];

    const gasLimit = await estimateGasWithBuffer(
      contract,
      'registerNextAppVersion',
      args
    );

    const tx = await contract.registerNextAppVersion(
      ...args,
      {gasLimit}
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

  async updateAppDeploymentStatus(appId: number, deploymentStatus: number) {
    const contract = await getContract(this.network, 'App', true, this.signer);
    
    const args = [appId, deploymentStatus];

    const gasLimit = await estimateGasWithBuffer(
      contract,
      'updateAppDeploymentStatus',
      args
    );

    const tx = await contract.updateAppDeploymentStatus(
      ...args,
      {gasLimit}
    );
      
    await tx.wait();
    return tx;
  }

  // Add deleteApp method
  async deleteApp(appId: number) {
    const contract = await getContract(this.network, 'App', true, this.signer);
    
    const args = [appId];

    const gasLimit = await estimateGasWithBuffer(
      contract,
      'deleteApp',
      args
    );

    const tx = await contract.deleteApp(
      ...args,
      {gasLimit}
    );
      
    await tx.wait();
    return tx;
  }
}
