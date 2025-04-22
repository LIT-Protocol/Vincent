Defined in: [packages/sdk/src/tool/types.ts:28](https://github.com/LIT-Protocol/Vincent/blob/main/packages/sdk/src/tool/types.ts#L28)

The Vincent Tool Client uses an ethers signer for your delegatee account to run Vincent Tools
on behalf of your app users.

The VincentToolClient will typically be used by an AI agent or your app backend service, as it
requires a signer that conforms to the ethers v5 signer API, and with access to your delegatee account's
private key to authenticate with the LIT network when executing the Vincent Tool

## Properties

### execute()

> **execute**: (`params`) => `Promise`\<`ExecuteJsResponse`\>

Defined in: [packages/sdk/src/tool/types.ts:29](https://github.com/LIT-Protocol/Vincent/blob/main/packages/sdk/src/tool/types.ts#L29)

#### Parameters

##### params

#### Returns

`Promise`\<`ExecuteJsResponse`\>
