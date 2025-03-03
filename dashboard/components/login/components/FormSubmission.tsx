// import { IRelayPKP, SessionSigs } from '@lit-protocol/types';
// import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
// import { litNodeClient } from '../utils/lit';
// import type { ConsentFormData } from './ConsentForm';
// import { ethers, ContractTransaction, ContractReceipt } from 'ethers';
// import { getPkpToolRegistryContract } from '../utils/get-pkp-tool-registry-contract';
// import { LIT_RPC } from "@lit-protocol/constants";

// interface FormSubmissionProps {
//   currentAccount: IRelayPKP;
//   sessionSigs: SessionSigs;
//   formData: ConsentFormData;
//   onSuccess?: () => void | Promise<void>;
// }

// interface ToolRegistrationStatus {
//   tool: string;
//   isRegistered: boolean;
//   isEnabled: boolean;
// }

// interface PermissionCheck {
//   delegatee: string;
//   toolsToPermit: string[];
// }

// interface VerificationData {
//   success: boolean;
//   verificationData: [
//     string[],  // delegatees
//     string[],  // registeredTools
//     any[],     // toolsWithPolicies
//     ...any[]   // policyParameters
//   ];
// }

// interface ToolWithPolicy {
//   delegatees: string[];
//   delegateesPolicyIpfsCids: string[];
//   toolIpfsCid: string;
// }

// interface PolicyParameter {
//   value: string;
// }

// export default function FormSubmission({
//   currentAccount,
//   sessionSigs,
//   formData,
//   onSuccess,
// }: FormSubmissionProps) {
//   const handleFormSubmission = async (): Promise<VerificationData> => {
//     try {
//       // Convert tokenId to BigNumber for consistency
//       const tokenId = ethers.BigNumber.from(currentAccount.tokenId);
      
//       console.log('Starting form submission with data:', {
//         tokenId: tokenId.toHexString(),
//         delegatees: formData.delegatees.map((d: string) => ethers.utils.getAddress(d)),
//         policies: formData.policies,
//         tools: formData.tools,
//         policyParameters: formData.policyParameters
//       });

//       // Connect to the Lit Node
//       await litNodeClient.connect();
//       console.log('Connected to Lit Node');

//       // Initialize the PKP wallet
//       const pkpWallet = new PKPEthersWallet({
//         controllerSessionSigs: sessionSigs,
//         pkpPubKey: currentAccount.publicKey,
//         litNodeClient,
//       });
//       await pkpWallet.init();
//       console.log('PKP wallet initialized');

//       // Assign a provider so that the PKP wallet can send transactions
//       const provider = new ethers.providers.JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE);
//       pkpWallet.provider = provider;

//       // Get the contract instance (provider-only)
//       const contract = await getPkpToolRegistryContract('datil-dev');
//       console.log('Contract instance created at:', contract.address);

//       // Validate delegatee addresses
//       const validDelegatees = formData.delegatees.map((d: string) => ethers.utils.getAddress(d));

//       // Connect the contract to the PKP wallet so it can sign transactions
//       const contractWithSigner = contract.connect(pkpWallet);

//       // -------------------------------------------
//       // Step 1: Check and register tools if needed
//       // -------------------------------------------
//       console.log('Checking tool registration status...');
//       const toolRegistrationPromises = formData.tools.map(async tool => {
//         const [isRegistered, isEnabled] = await contract.isToolRegistered(tokenId, tool);
//         return { tool, isRegistered, isEnabled } as ToolRegistrationStatus;
//       });
//       const toolRegistrationStatus = await Promise.all(toolRegistrationPromises);
      
//       const unregisteredTools = toolRegistrationStatus
//         .filter(status => !status.isRegistered || !status.isEnabled)
//         .map(status => status.tool);

//       if (unregisteredTools.length > 0) {
//         console.log('Registering new tools:', unregisteredTools);
//         // Call registerTools directly via the signer
//         const tx = await contractWithSigner.registerTools(tokenId, unregisteredTools, true, { gasLimit: 500000 });
//         console.log('Tool registration tx sent:', tx.hash);
//         const receipt = await tx.wait();
//         console.log('New tools registered successfully, receipt:', receipt);
//       } else {
//         console.log('All tools already registered and enabled');
//       }

//       // -----------------------------------------------
//       // Step 2: Check and add delegatees if needed
//       // -----------------------------------------------
//       console.log('Checking delegatee status...');
//       const currentDelegatees = await contract.getDelegatees(tokenId);
//       const newDelegatees = validDelegatees.filter(
//         delegatee => !currentDelegatees.map((d: string) => d.toLowerCase()).includes(delegatee.toLowerCase())
//       );

//       if (newDelegatees.length > 0) {
//         console.log('Adding new delegatees:', newDelegatees);
//         const delegateeTx = await contractWithSigner.addDelegatees(tokenId, newDelegatees, { gasLimit: 500000 });
//         await delegateeTx.wait();
//         console.log('New delegatees added successfully');
//       } else {
//         console.log('All delegatees already added');
//       }

//       // -------------------------------------------------------
//       // Step 3: Check and permit tools for delegatees if needed
//       // -------------------------------------------------------
//       console.log('Checking tool permissions...');
//       const permissionChecks = await Promise.all(
//         validDelegatees.map(async (delegatee: string) => {
//           const permittedTools = await contract.getPermittedToolsForDelegatee(tokenId, delegatee);
//           const permittedToolCids = permittedTools.map((t: ToolWithPolicy) => t.toolIpfsCid);
//           return {
//             delegatee,
//             toolsToPermit: formData.tools.filter((tool: string) => !permittedToolCids.includes(tool))
//           } as PermissionCheck;
//         })
//       );

//       // For each delegatee, set permission for each tool that is not yet permitted.
//       for (const check of permissionChecks) {
//         for (const tool of check.toolsToPermit) {
//           console.log(`Setting tool permission for delegatee ${check.delegatee} and tool ${tool}...`);
//           // Here we use the contract function (adjust the function name if needed)
//           const tx = await contractWithSigner.permitToolsForDelegatees(tokenId, [tool], [check.delegatee], { gasLimit: 500000 });
//           console.log('Permission tx sent:', tx.hash);
//           const receipt = await tx.wait();
//           console.log(`Tool permission set for delegatee ${check.delegatee} and tool ${tool}, receipt:`, receipt);
//         }
//       }

//       // --------------------------------------------------------
//       // Step 4: Check and set tool policies for delegatees if needed
//       // --------------------------------------------------------
//       console.log('Checking policy status...');
//       const toolsWithPolicies = await contract.getToolsWithPolicy(tokenId);
//       const policyUpdatesNeeded = validDelegatees.some((delegatee: string) =>
//         !toolsWithPolicies.some((tool: ToolWithPolicy) =>
//           tool.delegatees.map((d: string) => d.toLowerCase()).includes(delegatee.toLowerCase()) &&
//           formData.policies.every(policy => tool.delegateesPolicyIpfsCids.includes(policy))
//         )
//       );

//       if (policyUpdatesNeeded) {
//         console.log('Setting tool policies...');
//         const policyTx = await contractWithSigner.setToolPoliciesForDelegatees(
//           tokenId,
//           formData.tools,
//           validDelegatees,
//           formData.policies,
//           true,
//           { gasLimit: 500000 }
//         );
//         await policyTx.wait();
//         console.log('Tool policies set successfully');
//       } else {
//         console.log('All policies already set correctly');
//       }

//       // ----------------------------------------------------------------
//       // Step 5: Check and set policy parameters for each delegatee if needed
//       // ----------------------------------------------------------------
//       for (const delegatee of validDelegatees) {
//         console.log(`Checking policy parameters for delegatee ${delegatee}...`);
        
//         const parameterNames = formData.policyParameters.prefixes.map((_, i) => `prefix${i + 1}`);
//         const currentParameters = await contract.getToolPolicyParameters(
//           tokenId,
//           formData.tools[0],
//           delegatee,
//           parameterNames
//         );

//         // Decode current parameter values (assuming they are encoded as strings)
//         const currentPrefixes = currentParameters.map((param: PolicyParameter) =>
//           ethers.utils.defaultAbiCoder.decode(['string'], param.value)[0]
//         );
        
//         const prefixesMatch = formData.policyParameters.prefixes.every(
//           (prefix, i) => currentPrefixes[i] === prefix
//         );

//         if (!prefixesMatch) {
//           console.log(`Updating policy parameters for delegatee ${delegatee}...`);
//           const prefixValues = formData.policyParameters.prefixes.map(prefix => 
//             ethers.utils.defaultAbiCoder.encode(['string'], [prefix])
//           );

//           const paramTx = await contractWithSigner.setToolPolicyParametersForDelegatee(
//             tokenId,
//             formData.tools[0],
//             delegatee,
//             parameterNames,
//             prefixValues,
//             { gasLimit: 500000 }
//           );
//           await paramTx.wait();
//           console.log(`Policy parameters updated for delegatee ${delegatee}`);
//         } else {
//           console.log(`Policy parameters already correct for delegatee ${delegatee}`);
//         }
//       }

//       // ----------------------------
//       // Final state verification
//       // ----------------------------
//       const verificationData = await Promise.all([
//         contract.getDelegatees(tokenId),
//         contract.getAllRegisteredTools(tokenId),
//         contract.getToolsWithPolicy(tokenId),
//         ...validDelegatees.map(delegatee => 
//           contract.getToolPolicyParameters(
//             tokenId,
//             formData.tools[0],
//             delegatee,
//             formData.policyParameters.prefixes.map((_, i) => `prefix${i + 1}`)
//           )
//         )
//       ]);

//       console.log('Final state verification:', {
//         delegatees: verificationData[0],
//         registeredTools: verificationData[1],
//         toolsWithPolicies: verificationData[2],
//         policyParameters: verificationData.slice(3)
//       });

//       // Call onSuccess callback if provided
//       if (onSuccess) {
//         await onSuccess();
//       }

//       return {
//         success: true,
//         verificationData: [
//           verificationData[0],
//           verificationData[1],
//           verificationData[2],
//           ...verificationData.slice(3)
//         ]
//       };

//     } catch (error) {
//       console.error('Error processing transaction:', {
//         error,
//         errorCode: (error as any).code,
//         errorMessage: (error as any).message,
//         errorReason: (error as any).reason,
//         errorData: (error as any).data,
//         tokenId: currentAccount.tokenId,
//         delegatees: formData.delegatees
//       });
//       throw error;
//     }
//   };

//   return handleFormSubmission;
// }
