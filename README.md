## Interface for Vincent

## Getting Started

1. Clone this repo and install dependencies:
```bash
git clone https://github.com/LIT-Protocol/Vincent.git
npm i
```

2. Start your development server:
```bash
npm run dev
```

## Vincent Agent Wallet System Documentation

#Architecture Overview

The Vincent Agent Wallet system is a decentralized permission management framework designed to allow applications (Apps) to request and manage user permissions securely using an on-chain AgentPKP (Public Key Pair) registry and an off-chain App Registry backend. It leverages blockchain technology (Yellowstone) and Lit Protocol for secure key management and execution, ensuring users maintain control over their permissions while developers can manage their Apps efficiently.

# Key Components

AgentPKP (On-Chain Agent Registry)
Manages user-approved permissions for Apps.
Structure: AgentPKP → Apps → Roles → Tools → Policies.
Stores flattened tool-policy pairs approved by users via the Consent Page.
Controlled by the User Admin PKP, allowing updates like enabling/disabling Apps, Roles, or Tools.
App Registry (On-Chain)
Tracks delegatee addresses for Apps, managed by the App's Management Wallet.
Ensures only authorized delegatees can execute Tools on behalf of users.
App Registry (Off-Chain/Backend)
Stores App metadata, Roles, Tools, and Policy schemas in a database.
Provides versioning for Roles and Tools, enabling updates and notifications.
Exposes APIs for App registration, Role/Tool management, and Consent Page data retrieval.
Consent Page

A user-facing interface where permissions (Tools and Policies) are approved.
Displays App metadata and requested Roles/Tools from the App Registry.
Facilitates transaction signing with the User PKP and gas sponsorship via a Relayer.

Relayer

Sponsors gas costs (Yellowstone) and Lit payments for user transactions.
Uses capability delegation to enable seamless execution.

How It Works

Developer Flow

Developers register an App with a unique Management Wallet and define metadata (name, description, etc.).
They create Tools (with IPFS-hosted Lit Actions and Policy schemas) and compose them into Roles.
Role and Tool versions are tracked off-chain; updates create new versions without altering existing ones.
The App integrates with the Consent Page, passing appId and roleIds in URL parameters.
User Flow
Users access the Consent Page via an App, review requested Tools/Policies, and adjust Policy variables.
Approval triggers a transaction signed by the User PKP, sponsored by the Relayer, writing permissions to the Agent Registry.
Users can later manage permissions (disable Apps/Roles/Tools) via a dashboard.
Execution
Delegatees (approved by the App) use session signatures to execute Tools, validated against the Agent Registry.
Lit Protocol ensures secure signing and execution of Tool Lit Actions.

Why It’s Secure

User Control: The User PKP is the sole admin of the Agent Registry, ensuring only the user can approve or revoke permissions.
Immutable Permissions: On-chain data is flattened and immutable once written, preventing unauthorized changes.
Lit Protocol: Uses threshold cryptography and decentralized key management, eliminating single points of failure compared to centralized solutions like Turnkey.
Delegatee Verification: Only addresses approved by the App’s Management Wallet can execute Tools, enforced on-chain.
Versioning: Off-chain versioning ensures transparency and allows users to review updates, with notifications for changes.
Gas Sponsorship: The Relayer’s JIT sponsorship prevents users from needing to manage gas, reducing attack vectors while maintaining security via capability delegation.
Lit vs. Turnkey

Lit Protocol

Decentralized: Keys are split across a network of nodes using threshold cryptography.
Flexibility: Supports programmable Lit Actions for custom logic (e.g., Tools + Policies).
Security: No single entity controls keys; user PKPs are user-owned and managed via AuthMethods.
Cost: Requires Lit payments, offset by Relayer sponsorship in this system.
Turnkey
Centralized: Relies on a trusted third-party service to manage keys.
Simplicity: Easier to integrate for basic use cases but lacks programmability.
Security Trade-off: Centralized control introduces a single point of failure and trust dependency.
Cost: Typically subscription-based, potentially higher for complex workflows.
Why Lit?: Vincent prioritizes decentralization, user sovereignty, and programmable flexibility, making Lit the better fit over Turnkey’s centralized model.

Public APIs

App Registration

POST /api/v1/registerApp
Description: Registers a new App with a unique Management Wallet.
Parameters:
signedMessage (string, required): SIWE-signed message with App Management Wallet.
appName (string, required): Name of the App.
appDescription (string, required): Description of the App.
email (string, required): Contact email for the developer team.
domain (string, optional): App domain (v2).
logo (string, optional): App logo URL (v2).
Response:

json
{
  "success": true,
  "data": {
    "appId": "string",
    "appName": "string",
    "logo": "string"
  }
}
Fetch App Metadata
GET /api/v1/appMetadata
Description: Retrieves metadata for an App, used in Consent Page or dashboards.
Parameters:
appId (string, required): Unique App identifier.
Response:
json
{
  "success": true,
  "data": {
    "appId": "string",
    "appName": "string",
    "logo": "string"
  }
}

Update App Metadata
PUT /api/v1/updateApp
Description: Updates App metadata.
Parameters:
signedMessage (string, required): SIWE-signed message with Management Wallet.
appId (string, required): Must match registered appId.
appName (string, required).
appDescription (string, required).
email (string, required).
domain (string, optional, v2).
logo (string, optional, v2).

Response:
json
{
  "success": true,
  "data": {
    "appId": "string"
  }
}
Create Role
POST /api/v1/createRole
Description: Creates a new Role for an App with Tool-Policy pairs.
Parameters:
signedMessage (string, required): SIWE-signed message with Management Wallet.
appId (string, required): Must match registered appId.
roleName (string, required): Name of the Role.
roleDescription (string, required): Description of the Role.
toolPolicy (JSON array, required):
tool: { toolId: string, ipfsCid: string }.
policy: { policyId: string, ipfsCid: string, schema: [{ paramId: string, paramName: string, type: string, defaultValue: any }] }.
Response:
json
{
  "success": true,
  "data": {
    "appId": "string",
    "roleId": "string",
    "roleVersion": "init",
    "lastUpdated": "ISODate"
  }
}
Get Role
GET /api/v1/role
Description: Retrieves details of a specific Role.
Parameters:
appId (string, required).
roleId (string, required).Vincent Agent Wallet System Documentation
Architecture Overview
The Vincent Agent Wallet system is a decentralized permission management framework designed to allow applications (Apps) to request and manage user permissions securely using an on-chain AgentPKP (Public Key Pair) registry and an off-chain App Registry backend. It leverages blockchain technology (Yellowstone) and Lit Protocol for secure key management and execution, ensuring users maintain control over their permissions while developers can manage their Apps efficiently.
Key Components
AgentPKP (On-Chain Agent Registry)
Manages user-approved permissions for Apps.
Structure: AgentPKP → Apps → Roles → Tools → Policies.
Stores flattened tool-policy pairs approved by users via the Consent Page.
Controlled by the User Admin PKP, allowing updates like enabling/disabling Apps, Roles, or Tools.
App Registry (On-Chain)
Tracks delegatee addresses for Apps, managed by the App's Management Wallet.
Ensures only authorized delegatees can execute Tools on behalf of users.
App Registry (Off-Chain/Backend)
Stores App metadata, Roles, Tools, and Policy schemas in a database.
Provides versioning for Roles and Tools, enabling updates and notifications.
Exposes APIs for App registration, Role/Tool management, and Consent Page data retrieval.
Consent Page
A user-facing interface where permissions (Tools and Policies) are approved.
Displays App metadata and requested Roles/Tools from the App Registry.
Facilitates transaction signing with the User PKP and gas sponsorship via a Relayer.
Relayer
Sponsors gas costs (Yellowstone) and Lit payments for user transactions.
Uses capability delegation to enable seamless execution.
How It Works
Developer Flow
Developers register an App with a unique Management Wallet and define metadata (name, description, etc.).
They create Tools (with IPFS-hosted Lit Actions and Policy schemas) and compose them into Roles.
Role and Tool versions are tracked off-chain; updates create new versions without altering existing ones.
The App integrates with the Consent Page, passing appId and roleIds in URL parameters.
User Flow
Users access the Consent Page via an App, review requested Tools/Policies, and adjust Policy variables.
Approval triggers a transaction signed by the User PKP, sponsored by the Relayer, writing permissions to the Agent Registry.
Users can later manage permissions (disable Apps/Roles/Tools) via a dashboard.
Execution
Delegatees (approved by the App) use session signatures to execute Tools, validated against the Agent Registry.
Lit Protocol ensures secure signing and execution of Tool Lit Actions.
Why It’s Secure
User Control: The User PKP is the sole admin of the Agent Registry, ensuring only the user can approve or revoke permissions.
Immutable Permissions: On-chain data is flattened and immutable once written, preventing unauthorized changes.
Lit Protocol: Uses threshold cryptography and decentralized key management, eliminating single points of failure compared to centralized solutions like Turnkey.
Delegatee Verification: Only addresses approved by the App’s Management Wallet can execute Tools, enforced on-chain.
Versioning: Off-chain versioning ensures transparency and allows users to review updates, with notifications for changes.
Gas Sponsorship: The Relayer’s JIT sponsorship prevents users from needing to manage gas, reducing attack vectors while maintaining security via capability delegation.
Lit vs. Turnkey
Lit Protocol
Decentralized: Keys are split across a network of nodes using threshold cryptography.
Flexibility: Supports programmable Lit Actions for custom logic (e.g., Tools + Policies).
Security: No single entity controls keys; user PKPs are user-owned and managed via AuthMethods.
Cost: Requires Lit payments, offset by Relayer sponsorship in this system.
Turnkey
Centralized: Relies on a trusted third-party service to manage keys.
Simplicity: Easier to integrate for basic use cases but lacks programmability.
Security Trade-off: Centralized control introduces a single point of failure and trust dependency.
Cost: Typically subscription-based, potentially higher for complex workflows.
Why Lit?: Vincent prioritizes decentralization, user sovereignty, and programmable flexibility, making Lit the better fit over Turnkey’s centralized model.
Public APIs
App Registration
POST /api/v1/registerApp
Description: Registers a new App with a unique Management Wallet.
Parameters:
signedMessage (string, required): SIWE-signed message with App Management Wallet.
appName (string, required): Name of the App.
appDescription (string, required): Description of the App.
email (string, required): Contact email for the developer team.
domain (string, optional): App domain (v2).
logo (string, optional): App logo URL (v2).
Response:
json
{
  "success": true,
  "data": {
    "appId": "string",
    "appName": "string",
    "logo": "string"
  }
}
Fetch App Metadata
GET /api/v1/appMetadata
Description: Retrieves metadata for an App, used in Consent Page or dashboards.
Parameters:
appId (string, required): Unique App identifier.
Response:
json
{
  "success": true,
  "data": {
    "appId": "string",
    "appName": "string",
    "logo": "string"
  }
}
Update App Metadata
PUT /api/v1/updateApp
Description: Updates App metadata.
Parameters:
signedMessage (string, required): SIWE-signed message with Management Wallet.
appId (string, required): Must match registered appId.
appName (string, required).
appDescription (string, required).
email (string, required).
domain (string, optional, v2).
logo (string, optional, v2).
Response:
json
{
  "success": true,
  "data": {
    "appId": "string"
  }
}
Create Role
POST /api/v1/createRole
Description: Creates a new Role for an App with Tool-Policy pairs.
Parameters:
signedMessage (string, required): SIWE-signed message with Management Wallet.
appId (string, required): Must match registered appId.
roleName (string, required): Name of the Role.
roleDescription (string, required): Description of the Role.
toolPolicy (JSON array, required):
tool: { toolId: string, ipfsCid: string }.
policy: { policyId: string, ipfsCid: string, schema: [{ paramId: string, paramName: string, type: string, defaultValue: any }] }.
Response:
json
{
  "success": true,
  "data": {
    "appId": "string",
    "roleId": "string",
    "roleVersion": "init",
    "lastUpdated": "ISODate"
  }
}
Get Role
GET /api/v1/role
Description: Retrieves details of a specific Role.
Parameters:
appId (string, required).
roleId (string, required).
Response:
json
{
  "success": true,
  "data": {
    "roleId": "string",
    "roleVersion": "string",
    "toolPolicy": [
      {
        "tool": { "toolId": "string", "ipfsCid": "string" },
        "policy": {
          "policyId": "string",
          "ipfsCid": "string",
          "schema": [{ "paramId": "string", "paramName": "string", "type": "string", "defaultValue": "any" }]
        }
      }
    ]
  }
}
Update Role
PUT /api/v1/updateRole
Description: Updates a Role with a new version.
Parameters: Same as POST /api/v1/createRole, plus:
roleId (string, required).
roleVersion (string, required): Developer-defined version name.
Response:
json
{
  "success": true,
  "data": {
    "appId": "string",
    "roleId": "string",
    "roleVersion": "string"
  }
}
Fetch All Roles for an App
GET /api/v1/roles
Description: Retrieves all Roles for an App.
Parameters:
appId (string, required).
Response: Array of Role objects (see GET /api/v1/role response).
Consent Page Implementation
Integration Steps
Button Setup:
Add a "Sign with Vincent" or "Create Vincent Agent Wallet" button in your App.
On click, open a new tab with the Consent Page URL:
https://consent.vincent.xyz/?appId={appId}&roleIds={roleId1},{roleId2}.
Data Fetching:
The Consent Page queries:
GET /api/v1/appMetadata for App info.
GET /api/v1/role for each roleId to display Tools/Policies.
User Interaction:
Users review Tools and adjust Policy variables (default values from schema).
(v2) Users can disable specific Tools.
Transaction Signing:
User selects an AuthMethod to generate a pkpSessionSig.
The Consent Page crafts an addRole() transaction, estimates gas, and signs it with pkpSign.
Relayer provides capabilityDelegationAuthSig and calls /send-txsponsorAndBroadcast to execute.
On-Chain Update:
Permissions are written to the Agent Registry as flattened Tool-Policy pairs.
App Management Functions
Add/Remove Delegatees
On-Chain (App Registry):
Management Wallet calls AppRegistry.addDelegatee(address) or AppRegistry.removeDelegatee(address) to update delegateeAddresses.
Solidity Example:
solidity
function addDelegatee(address delegatee) public {
  require(msg.sender == managementWallet, "Only management wallet");
  delegateeAddresses.add(delegatee);
}
Disable Apps/Roles/Tools
User Dashboard:
Query AgentRegistry.agents[agentPkpTokenId].appAddresses and set enabled=false for an App.
Disable specific Roles or Tools via signed transactions updating enabled fields.
Payment Delegation DB Setup
(Copied from existing docs, assuming standard Lit Protocol/Yellowstone setup)
Initialize Database:
Store App Management Wallet, delegatee addresses, and payment delegation records.
Schema: { appId: string, managementWallet: address, delegatees: address[], paymentDetails: { gasLimit: uint, litPayment: uint } }.
Relayer Integration:
Configure Relayer to read from the DB and sponsor gas/Lit payments for delegatee actions.
Use capabilityDelegationAuthSig for JIT sponsorship.
Management:
Management Wallet updates delegatee payment records via signed transactions.
Setting Up the Backend for an API
Prerequisites
Node.js, MongoDB (or similar DB), IPFS client, Yellowstone RPC endpoint, Lit SDK.
Steps
Database Setup:
Define schemas for App, Role, RoleVersion, Tool, ToolVersion (see interfaces above).
Enforce unique constraints on managementWallet and appId.
API Routes:
Use Express.js (or similar) to implement the public APIs.
Validate signedMessage with SIWE library to authenticate Management Wallet.
IPFS Integration:
Store Tool and Policy code in IPFS, return CIDs in API responses.
Notifications:
On Role/Tool version updates, queue push notifications (e.g., via Firebase) to affected users.
Security:
Rate-limit APIs, validate all inputs, and use HTTPS.
Example (Pseudo-code)
javascript
const express = require('express');
const { siwe } = require('siwe');
const app = express();

app.post('/api/v1/registerApp', async (req, res) => {
  const { signedMessage, appName, appDescription, email } = req.body;
  const { address } = await siwe.verify(signedMessage);
  const appId = generateAppId();
  await db.apps.insert({ appId, managementWallet: address, name: appName, description: appDescription, email });
  res.json({ success: true, data: { appId, appName } });
});

app.listen(3000);
Response:
json
{
  "success": true,
  "data": {
    "roleId": "string",
    "roleVersion": "string",
    "toolPolicy": [
      {
        "tool": { "toolId": "string", "ipfsCid": "string" },
        "policy": {
          "policyId": "string",
          "ipfsCid": "string",
          "schema": [{ "paramId": "string", "paramName": "string", "type": "string", "defaultValue": "any" }]
        }
      }
    ]
  }
}
Update Role
PUT /api/v1/updateRole
Description: Updates a Role with a new version.
Parameters: Same as POST /api/v1/createRole, plus:
roleId (string, required).
roleVersion (string, required): Developer-defined version name.
Response:
json
{
  "success": true,
  "data": {
    "appId": "string",
    "roleId": "string",
    "roleVersion": "string"
  }
}
Fetch All Roles for an App
GET /api/v1/roles
Description: Retrieves all Roles for an App.
Parameters:
appId (string, required).
Response: Array of Role objects (see GET /api/v1/role response).
Consent Page Implementation
Integration Steps
Button Setup:
Add a "Sign with Vincent" or "Create Vincent Agent Wallet" button in your App.
On click, open a new tab with the Consent Page URL:
https://consent.vincent.xyz/?appId={appId}&roleIds={roleId1},{roleId2}.
Data Fetching:
The Consent Page queries:
GET /api/v1/appMetadata for App info.
GET /api/v1/role for each roleId to display Tools/Policies.
User Interaction:
Users review Tools and adjust Policy variables (default values from schema).
(v2) Users can disable specific Tools.
Transaction Signing:
User selects an AuthMethod to generate a pkpSessionSig.
The Consent Page crafts an addRole() transaction, estimates gas, and signs it with pkpSign.
Relayer provides capabilityDelegationAuthSig and calls /send-txsponsorAndBroadcast to execute.
On-Chain Update:
Permissions are written to the Agent Registry as flattened Tool-Policy pairs.
App Management Functions
Add/Remove Delegatees
On-Chain (App Registry):
Management Wallet calls AppRegistry.addDelegatee(address) or AppRegistry.removeDelegatee(address) to update delegateeAddresses.
Solidity Example:
solidity
function addDelegatee(address delegatee) public {
  require(msg.sender == managementWallet, "Only management wallet");
  delegateeAddresses.add(delegatee);
}
Disable Apps/Roles/Tools
User Dashboard:
Query AgentRegistry.agents[agentPkpTokenId].appAddresses and set enabled=false for an App.
Disable specific Roles or Tools via signed transactions updating enabled fields.
Payment Delegation DB Setup
(Copied from existing docs, assuming standard Lit Protocol/Yellowstone setup)
Initialize Database:
Store App Management Wallet, delegatee addresses, and payment delegation records.
Schema: { appId: string, managementWallet: address, delegatees: address[], paymentDetails: { gasLimit: uint, litPayment: uint } }.
Relayer Integration:
Configure Relayer to read from the DB and sponsor gas/Lit payments for delegatee actions.
Use capabilityDelegationAuthSig for JIT sponsorship.
Management:
Management Wallet updates delegatee payment records via signed transactions.
Setting Up the Backend for an API
Prerequisites
Node.js, MongoDB (or similar DB), IPFS client, Yellowstone RPC endpoint, Lit SDK.
Steps
Database Setup:
Define schemas for App, Role, RoleVersion, Tool, ToolVersion (see interfaces above).
Enforce unique constraints on managementWallet and appId.
API Routes:
Use Express.js (or similar) to implement the public APIs.
Validate signedMessage with SIWE library to authenticate Management Wallet.
IPFS Integration:
Store Tool and Policy code in IPFS, return CIDs in API responses.
Notifications:
On Role/Tool version updates, queue push notifications (e.g., via Firebase) to affected users.
Security:
Rate-limit APIs, validate all inputs, and use HTTPS.
Example (Pseudo-code)
javascript
const express = require('express');
const { siwe } = require('siwe');
const app = express();

app.post('/api/v1/registerApp', async (req, res) => {
  const { signedMessage, appName, appDescription, email } = req.body;
  const { address } = await siwe.verify(signedMessage);
  const appId = generateAppId();
  await db.apps.insert({ appId, managementWallet: address, name: appName, description: appDescription, email });
  res.json({ success: true, data: { appId, appName } });
});

app.listen(3000);
