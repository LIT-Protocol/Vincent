---
category: Users
title: Onboarding
---

# Onboarding

Each time you visit an app on Vincent, you’ll be directed to that app’s dedicated connect page. This is where you will configure and manage your app-specific delegations, permitting it to use your assets and data according to the guidelines you set. Follow the steps below to begin your journey.

## 1. Create an Agent Wallet

The first time you visit an app powered by Vincent, you’ll be prompted to create your Agent Wallet using a credential of your choice. Currently, email, phone number, and Passkey methods are supported. This credential is used to control your Agent Wallet which is securely managed by Lit Protocol’s [decentralized key management network](https://developer.litprotocol.com/resources/how-it-works). By default, the same Agent Wallet will be used across all Vincent applications.

![User Connect](./images/connect.png)

## 2. Review Permissions & Delegate

After you connect you'll be required to review the permissions requested by the app on the Connect Page. On this page you can see the following details about the app:

- **App:** The name and description of the app you're visiting.
- **Account Address:** The EOA wallet address associated with the App creator.
- **App Version:** The version of the app you're visiting. If the app publishes a new version you'll be prompted to update it.
- **Abilities:** Abilities are used to execute the operations that you permit a given app to perform on your _behalf_ using your Agent Wallet. All Abilities are represented by [Lit Actions](https://developer.litprotocol.com/sdk/serverless-signing/overview). After you delegate your Agent Wallet to a given Ability, the application owner can no longer change the Ability's behavior, making the delegation system immutable. As the owner of your Agent Wallet, you always have the ability to revoke a Ability that you previously permitted.
- **Policies:** Policies are the guardrails you set for permitted abilities, dictating the conditions that they operate under. An example is a daily spend limit, or requiring MFA for swaps exceeding a specific dollar amount. When you define a Policy, it must be met before a given Ability can be executed. Just like Abilities, Policies are also codified as Lit Actions.

![Connect Page](./images/connect-page.png)

## 3. Update App Version

Once you've approved an App and it publishes a new version, you'll be prompted to update to the latest version when you visit the App's Connect Page again. Note, it's not mandatory to update to the latest version unless the App disables an older version.

![Update App Version](./images/connect-update.png)

## 4. Redirect to the App

After you've logged in via the Connect Page you'll be redirected to the App page based on the `redirectUri` specified in the URLSearchParams: `https://dashboard.heyvincent.ai/appId/160/connect?redirectUri=http://localhost:3000`
