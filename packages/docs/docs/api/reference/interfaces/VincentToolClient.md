The Vincent Tool Client uses an ethers signer for your delegatee account to run Vincent Tools
on behalf of your app users.

The VincentToolClient will typically be used by an AI agent or your app backend service, as it
requires a signer that conforms to the ethers v5 signer API, and with access to your delegatee account's
private key to authenticate with the LIT network when executing the Vincent Tool

## Properties

### execute()

> **execute**: (`params`) => `Promise`\<`ExecuteJsResponse`\>

#### Parameters

##### params

#### Returns

`Promise`\<`ExecuteJsResponse`\>
