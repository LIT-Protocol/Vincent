<!-- omit from toc -->

# Vincent Ability Hyperliquid

A Vincent Ability for securely interacting with the Hyperliquid API.

- [Testing the Ability](#testing-the-ability)
  - [Prerequisites](#prerequisites)
    - [Create the `.env` file](#create-the-env-file)
    - [Fund the Agent Wallet PKP with USDC](#fund-the-agent-wallet-pkp-with-usdc)
      - [Get the Agent Wallet PKP ETH address](#get-the-agent-wallet-pkp-eth-address)
      - [Funding on Hyperliquid Testnet](#funding-on-hyperliquid-testnet)
      - [Funding on Hyperliquid Mainnet](#funding-on-hyperliquid-mainnet)
    - [Verify the Agent Wallet PKP USDC Balance](#verify-the-agent-wallet-pkp-usdc-balance)
  - [Balance E2E Tests](#balance-e2e-tests)
  - [Deposit E2E Tests](#deposit-e2e-tests)
    - [Depositing for Hyperliquid Mainnet](#depositing-for-hyperliquid-mainnet)
  - [Transfer to Spot E2E Tests](#transfer-to-spot-e2e-tests)
  - [Spot Buy E2E Tests](#spot-buy-e2e-tests)
  - [Spot Sell E2E Tests](#spot-sell-e2e-tests)
  - [Cancel Order E2E Tests](#cancel-order-e2e-tests)
  - [Cancel All Orders E2E Tests](#cancel-all-orders-e2e-tests)
  - [Trade History E2E Tests](#trade-history-e2e-tests)
  - [Open Orders E2E Tests](#open-orders-e2e-tests)
  - [Transfer to Perp E2E Tests](#transfer-to-perp-e2e-tests)
  - [Perp Long E2E Tests](#perp-long-e2e-tests)
  - [Perp Short E2E Tests](#perp-short-e2e-tests)

# Testing the Ability

In the [test/e2e](./test/e2e/) directory, you can find several E2E tests for the various Hyperliquid functions this Ability supports. You can run these tests against the Hyperliquid mainnet, using assets with real world value, or you can execute against the Hyperliquid testnet, using test assets.

The E2E tests for this Ability are not expected to be ran concurrently. This is because each test suite relies on a balance being available for it to execute. The expected order of execution is:

1. [Balance E2E Tests](#running-the-balance-e2e-tests) - A sanity check to ensure the Agent Wallet PKP has a balance of USDC on the Hyperliquid network you're running against.
2. [Deposit E2E Tests](#running-the-deposit-e2e-tests) - Deposits USDC into the Agent Wallet PKP's Hyperliquid mainnet portfolio.
   - This test will **not** run if you set the Ability parameter `useTestnet` to `true`. This is because deposits via a bridge contract are only supported on Hyperliquid mainnet. You can get test USDC on Hyperliquid testnet by following [this process](#funding-on-hyperliquid-testnet).
3. [Transfer to Spot E2E Tests](#running-the-transfer-to-spot-e2e-tests) - Transfers USDC from the Agent Wallet PKP's Hyperliquid Perp balance to it's Hyperliquid spot balance. The PKP must have at least a Perp balance of `USDC_TRANSFER_AMOUNT` USDC.
4. [Spot Buy E2E Tests](#running-the-spot-buy-e2e-tests) - Places a Spot Buy order for `SPOT_BUY_AMOUNT_USDC` USDC of the token specified by `TOKEN_OUT_NAME` using USDC.
5. [Spot Sell E2E Tests](#running-the-spot-sell-e2e-tests) - Places a Spot Sell order for `SPOT_SELL_AMOUNT_USDC` of the token specified by `TOKEN_TO_SELL`.
6. [Open Orders E2E Tests](#running-the-open-orders-e2e-tests) - Fetches all open orders (Spot and Perp) for the Agent Wallet PKP, and logs them to the console.
7. [Cancel Order E2E Tests](#running-the-cancel-order-e2e-tests) - Cancels a Spot order for the order ID specified by `ORDER_ID_TO_CANCEL`.
8. [Cancel All Orders E2E Tests](#running-the-cancel-all-orders-e2e-tests) - Cancels all open Spot orders for the market specified by `TRADING_PAIR`.
9. [Trade History E2E Tests](#running-the-trade-history-e2e-tests) - Fetches the Spot and Perp trade history of the Agent Wallet PKP on Hyperliquid mainnet or testnet.
10. [Transfer to Perp E2E Tests](#running-the-transfer-to-perp-e2e-tests) - Transfers USDC from the Agent Wallet PKP's Hyperliquid spot balance to it's Hyperliquid Perp balance. The PKP must have at least a Spot balance of `USDC_TRANSFER_AMOUNT` USDC.

The E2E tests by default expected the Agent Wallet PKP to have a Perp or Spot balance of at least `15` USDC. Each test has a `const` like `USDC_TRANSFER_AMOUNT` (for the transfer E2E tests) that configures how much of the USDC balance is used to run the tests. There are order amount minimums associated with each market on Hyperliquid. So the minimum amount accepted by Hyperliquid to Spot Buy on the market `BTC/USDC` is not the same as the minimum amount accepted by Hyperliquid to Spot Buy on the market `ETH/USDC`.

Additionally, the same markets are not available on both Hyperliquid mainnet and testnet. So you may need to adjust the `consts` like `TOKEN_OUT_NAME` and/or `TRADING_PAIR` that configure what market the order is being executed on for tests like the Spot Buy, Spot Sell, Perp Long, Perp Short.

You can view which markets are available on [Hyperliquid mainnet](https://app.hyperliquid.xyz/trade) or [the testnet](https://app.hyperliquid-testnet.xyz/trade) by clicking the market drop down in the top left of the UI.

## Prerequisites

### Create the `.env` file

Copy the [.env.example](./.env.example) file to a new file called `.env` and populate the environment variables.

The wallet for `TEST_FUNDER_PRIVATE_KEY` is expected to have Lit test tokens in order to fund the rest of the test wallets. You can use the [Lit Testnet Faucet](https://chronicle-yellowstone-faucet.getlit.dev/) to fund this wallet.

### Fund the Agent Wallet PKP with USDC

#### Get the Agent Wallet PKP ETH address

You can get the Agent Wallet PKP ETH address by running the following command:

```
pnpx nx run ability-hyperliquid:test-e2e packages/apps/ability-hyperliquid/test/e2e/balance.spec.ts
```

After running the above command, you'll see multiple logs with the Agent Wallet PKP ETH address:

```
[Perp Balance] Agent Wallet PKP ETH Address: 0x17f51B528A0eA0ea19ABa0F343Dc9beED0FCc428
```

#### Funding on Hyperliquid Testnet

To get test USDC on Hyperliquid testnet, you need to deposit a minimum of `5` USDC into Hyperliquid mainnet. Afterwards you can claim `1000` test USDC on Hyperliquid testnet ([docs](https://hyperliquid.gitbook.io/hyperliquid-docs/onboarding/testnet-faucet)).

In the Lit Bitwarden, there's is a wallet titled: `Vincent Ability Hyperliquid E2E Test USDC Funder` that has made a `5` USDC deposit into Hyperliquid mainnet, and has a balance of test USDC on Hyperliquid testnet. You can add the private key to your browser wallet of choice (e.g. MetaMask), and then send test USDC to the Agent Wallet PKP ETH address on this screen: https://app.hyperliquid-testnet.xyz/portfolio

#### Funding on Hyperliquid Mainnet

To make a deposit into Hyperliquid mainnet, you need to send a minimum of `5` USDC from the Agent Wallet PKP, to the [Hyperliquid bridge contract](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/bridge2#deposit) that's deployed on Arbitrum mainnet.

To do this, you can excute the [Deposit E2E test](#running-the-deposit-e2e-tests), which will send the `5` USDC from the Agent Wallet PKP to the Hyperliquid bridge contract, giving the Agent Wallet a balance of `5` USDC on Hyperliquid mainnet.

### Verify the Agent Wallet PKP USDC Balance

Run the following command to log the balances of the Agent Wallet PKP on Hyperliquid network you're running against:

```
pnpx nx run ability-hyperliquid:test-e2e packages/apps/ability-hyperliquid/test/e2e/balance.spec.ts
```

Depending on whether you sent from the `Vincent Ability Hyperliquid E2E Test USDC Funder`'s `spot` or `perp` balance, one of the following logs will show the balance increase:

Spot balance:

```
[Spot Balance] Full spot state: {
    balances: [
        {
            coin: 'USDC',
            token: 0,
            total: '0.0',
            hold: '0.0',
            entryNtl: '0.0'
        }
    ]
}
```

Perp balance:

```
[Perp Balance] Full perp state: {
    marginSummary: {
        accountValue: '25.0',
        totalNtlPos: '0.0',
        totalRawUsd: '25.0',
        totalMarginUsed: '0.0'
    },
    crossMarginSummary: {
        accountValue: '25.0',
        totalNtlPos: '0.0',
        totalRawUsd: '25.0',
        totalMarginUsed: '0.0'
    },
    crossMaintenanceMarginUsed: '0.0',
    withdrawable: '25.0',
    assetPositions: [],
    time: 1762827649707
}
```

In this case a `25` USDC transfer was made from the `Vincent Ability Hyperliquid E2E Test USDC Funder`'s `perp` balance to the Agent Wallet PKP's `perp` balance.

## Balance E2E Tests

This test will work on both Hyperliquid mainnet and testnet.

This test will log the Spot and Perp balances of the Agent Wallet PKP on Hyperliquid mainnet or testnet.

```
pnpx nx run ability-hyperliquid:test-e2e packages/apps/ability-hyperliquid/test/e2e/balance.spec.ts
```

## Deposit E2E Tests

The deposit action for the Ability will **not** run if you set the Ability parameter `useTestnet` to `true`. This is because deposits via a bridge contract are only supported on Hyperliquid mainnet.

To get test USDC on Hyperliquid testnet, you need to follow [this process](#funding-on-hyperliquid-testnet).

### Depositing for Hyperliquid Mainnet

Running this E2E test will attempt to deposit `5` USDC from Arbitrum mainnet into the Hyperliquid bridge contract, giving the Agent Wallet a balance of `5` USDC on Hyperliquid mainnet.

In order for this to be successful, the Agent Wallet PKP must have at least 5 `USDC` and native ETH on Arbitrum mainnet. You can check the balance of the Agent Wallet PKP on Arbitrum mainnet by running [the balance test](#verify-the-agent-wallet-pkp-usdc-balance), or checking the Arbitrum mainnet block explorer.

```
pnpx nx run ability-hyperliquid:test-e2e packages/apps/ability-hyperliquid/test/e2e/balance.spec.ts
```

## Transfer to Spot E2E Tests

This test will work on both Hyperliquid mainnet and testnet.

In order for this to be successful, the Agent Wallet PKP must have at least a Perp balance of `USDC_TRANSFER_AMOUNT` USDC. You can check the balance of the Agent Wallet PKP on Hyperliquid mainnet or testnet by running [the balance test](#verify-the-agent-wallet-pkp-usdc-balance).

```
pnpx nx run ability-hyperliquid:test-e2e packages/apps/ability-hyperliquid/test/e2e/transfer/to-spot.spec.ts
```

You should see the following logs indicating the transfer from the Perp balance to the Spot balance was successful:

```
[Spot] Clearinghouse state after transfer {
    balances: [
        {
            coin: 'USDC',
            token: 0,
            total: '15.0',
            hold: '0.0',
            entryNtl: '0.0'
        }
    ]
}
[Spot] Found 1 token balance(s):
    - USDC: total=15.0, hold=0.0, available=15.000000
[Spot] Initial balance: 0.0
[Spot] Final balance: 15.0
[Spot] Expected increase: 15
[Spot] Actual increase: 15
```

## Spot Buy E2E Tests

This test will work on both Hyperliquid mainnet and testnet.

In order for this to be successful, the Agent Wallet PKP must have at least a Perp balance of `USDC_TRANSFER_AMOUNT` USDC. You can check the balance of the Agent Wallet PKP on Hyperliquid mainnet or testnet by running [the balance test](#verify-the-agent-wallet-pkp-usdc-balance).

This test will put in an order to buy **up to, but not over** `SPOT_BUY_AMOUNT_USDC` USDC of the token specified by `TOKEN_OUT_NAME` using USDC.

```
pnpx nx run ability-hyperliquid:test-e2e packages/apps/ability-hyperliquid/test/e2e/spot/buy.spec.ts
```

You should see the following logs indicating the Spot Buy was successful:

```
[Spot Buy Execute] {
  success: true,
  result: {
    action: 'spotBuy',
    orderResult: {
      status: 'ok',
      response: {
        type: 'order',
        data: {
          statuses: [
            {
              filled: { totalSz: '3.0', avgPx: '5.1085', oid: 42815357657 }
            }
          ]
        }
      }
    }
  },
  context: {
    delegation: {
      delegateeAddress: '0xb50aBA1E265B52067aF97401C25C39efF57Fe83b',
      delegatorPkpInfo: {
        tokenId: '64398341638522492941822855531388288999933789608071521616433988119257635428447',
        ethAddress: '0x17f51B528A0eA0ea19ABa0F343Dc9beED0FCc428',
        publicKey: '0x04576960d83a4eaf042e585c1cf90035b869b087631312719fa2b96fecde30705dbf80711fc30f6435e6a0739d1f47201320563a7f51357c146421c96355f6cbe3'
      }
    },
    abilityIpfsCid: 'QmeB5SM3UxcFYKYNffhM4VMWXSnFoZPAH8iLAXTgYPPupp',
    appId: 47700028661,
    appVersion: 4,
    policiesContext: { allow: true, evaluatedPolicies: [], allowedPolicies: {} }
  }
}
```

## Spot Sell E2E Tests

This test will work on both Hyperliquid mainnet and testnet.

In order for this to be successful, the Agent Wallet PKP must have at least a Spot balance of `SPOT_SELL_AMOUNT_USDC` `TOKEN_TO_SELL`. You can check the balance of the Agent Wallet PKP on Hyperliquid mainnet or testnet by running [the balance test](#verify-the-agent-wallet-pkp-usdc-balance).

This test will put in an order to sell `SPOT_SELL_AMOUNT_USDC` of `TOKEN_TO_SELL`.

```
pnpx nx run ability-hyperliquid:test-e2e packages/apps/ability-hyperliquid/test/e2e/spot/sell.spec.ts
```

You should see the following logs indicating the Spot Sell was successful:

```
[Spot Sell Execute] {
  success: true,
  result: {
    action: 'spotSell',
    orderResult: {
      status: 'ok',
      response: {
        type: 'order',
        data: {
          statuses: [
            {
              filled: { totalSz: '2.0', avgPx: '5.058', oid: 42815741000 }
            }
          ]
        }
      }
    }
  },
  context: {
    delegation: {
      delegateeAddress: '0xb50aBA1E265B52067aF97401C25C39efF57Fe83b',
      delegatorPkpInfo: {
        tokenId: '64398341638522492941822855531388288999933789608071521616433988119257635428447',
        ethAddress: '0x17f51B528A0eA0ea19ABa0F343Dc9beED0FCc428',
        publicKey: '0x04576960d83a4eaf042e585c1cf90035b869b087631312719fa2b96fecde30705dbf80711fc30f6435e6a0739d1f47201320563a7f51357c146421c96355f6cbe3'
      }
    },
    abilityIpfsCid: 'QmeB5SM3UxcFYKYNffhM4VMWXSnFoZPAH8iLAXTgYPPupp',
    appId: 47700028661,
    appVersion: 4,
    policiesContext: { allow: true, evaluatedPolicies: [], allowedPolicies: {} }
  }
}
```

## Cancel Order E2E Tests

This test will work on both Hyperliquid mainnet and testnet.

For this test to be successful, you must set the `ORDER_ID_TO_CANCEL` `const` to the order ID of an unfulfilled Spot order on the market specified by `TRADING_PAIR`. You can obtain an order ID by checking the orders of the Agent Wallet PKP on Hyperliquid mainnet or testnet by running [Open Orders](#running-the-open-orders-e2e-tests) test.

```
pnpx nx run ability-hyperliquid:test-e2e packages/apps/ability-hyperliquid/test/e2e/spot/cancel-order.spec.ts
```

You should see the following logs indicating the Cancel Order was successful:

```
[should run execute to cancel order] executeResult {
  success: true,
  result: {
    action: 'cancelOrder',
    cancelResult: {
      status: 'ok',
      response: { type: 'cancel', data: { statuses: [ 'success' ] } }
    }
  },
  context: {
    delegation: {
      delegateeAddress: '0xb50aBA1E265B52067aF97401C25C39efF57Fe83b',
      delegatorPkpInfo: {
        tokenId: '64398341638522492941822855531388288999933789608071521616433988119257635428447',
        ethAddress: '0x17f51B528A0eA0ea19ABa0F343Dc9beED0FCc428',
        publicKey: '0x04576960d83a4eaf042e585c1cf90035b869b087631312719fa2b96fecde30705dbf80711fc30f6435e6a0739d1f47201320563a7f51357c146421c96355f6cbe3'
      }
    },
    abilityIpfsCid: 'QmeB5SM3UxcFYKYNffhM4VMWXSnFoZPAH8iLAXTgYPPupp',
    appId: 47700028661,
    appVersion: 4,
    policiesContext: { allow: true, evaluatedPolicies: [], allowedPolicies: {} }
  }
}
```

## Cancel All Orders E2E Tests

This test will work on both Hyperliquid mainnet and testnet.

This test simply cancels all open Spot orders for the market specified by `TRADING_PAIR`.

```
pnpx nx run ability-hyperliquid:test-e2e packages/apps/ability-hyperliquid/test/e2e/spot/cancel-all-orders.spec.ts
```

You should see the following logs indicating the Cancel All Orders was successful:

```
[should run execute to cancel all orders] executeResult {
  success: true,
  result: { action: 'cancelAllOrdersForSymbol' },
  context: {
    delegation: {
      delegateeAddress: '0xb50aBA1E265B52067aF97401C25C39efF57Fe83b',
      delegatorPkpInfo: {
        tokenId: '64398341638522492941822855531388288999933789608071521616433988119257635428447',
        ethAddress: '0x17f51B528A0eA0ea19ABa0F343Dc9beED0FCc428',
        publicKey: '0x04576960d83a4eaf042e585c1cf90035b869b087631312719fa2b96fecde30705dbf80711fc30f6435e6a0739d1f47201320563a7f51357c146421c96355f6cbe3'
      }
    },
    abilityIpfsCid: 'QmeB5SM3UxcFYKYNffhM4VMWXSnFoZPAH8iLAXTgYPPupp',
    appId: 47700028661,
    appVersion: 4,
    policiesContext: { allow: true, evaluatedPolicies: [], allowedPolicies: {} }
  }
}
```

## Trade History E2E Tests

This test will work on both Hyperliquid mainnet and testnet.

This test will log the Spot and Perp trade history of the Agent Wallet PKP on Hyperliquid mainnet or testnet.

```
pnpx nx run ability-hyperliquid:test-e2e packages/apps/ability-hyperliquid/test/e2e/tradeHistory.spec.ts
```

You should see something similar to the following logs indicating fetching the trade history was successful:

```
[Trade History] Full user fills response: [
  {
    coin: 'PURR/USDC',
    px: '5.1085',
    sz: '2.0',
    side: 'B',
    time: 1762838203560,
    startPosition: '0.0',
    dir: 'Buy',
    closedPnl: '0.0',
    hash: '0x122de8de1eb2e5d013a7041b7585bb01140000c3b9b604a2b5f69430ddb6bfba',
    oid: 42819254595,
    crossed: true,
    fee: '0.0014',
    tid: 681613753058186,
    feeToken: 'PURR',
    twapId: null
  },
  {
    coin: 'PURR/USDC',
    px: '5.058',
    sz: '2.0',
    side: 'A',
    time: 1762834095134,
    startPosition: '2.9979',
    dir: 'Sell',
    closedPnl: '-0.1081569',
    hash: '0x8739e4d855acc84f88b3041b752870011200fcbdf0afe7212b02902b14a0a23a',
    oid: 42815741000,
    crossed: true,
    fee: '0.0070812',
    tid: 799015822074073,
    feeToken: 'USDC',
    twapId: null
  },
]
[Ledger Updates] Full ledger updates: [
  {
    time: 1762827527721,
    hash: '0x977d7afdb352d8bf98f7041b74935c01090092e34e55f7913b4626507256b2aa',
    delta: {
      type: 'send',
      user: '0x7787794d6f3d2f71ba02d51aec2265aa09d86cb9',
      destination: '0x17f51b528a0ea0ea19aba0f343dc9beed0fcc428',
      sourceDex: '',
      destinationDex: '',
      token: 'USDC',
      amount: '10.0',
      usdcValue: '10.0',
      fee: '1.0',
      nativeTokenFee: '0.0',
      nonce: 1762826770389,
      feeToken: 'USDC'
    }
  },
  {
    time: 1762828781566,
    hash: '0x380fc68b72b15b563989041b74afc7011800de710db47a28dbd871de31b53540',
    delta: { type: 'accountClassTransfer', usdc: '5.0', toPerp: false }
  },
  {
    time: 1762829284703,
    hash: '0xe95b6753f2bc447fead5041b74bb2b0124007f398dbf63518d2412a6b1b01e6a',
    delta: {
      type: 'send',
      user: '0x7787794d6f3d2f71ba02d51aec2265aa09d86cb9',
      destination: '0x17f51b528a0ea0ea19aba0f343dc9beed0fcc428',
      sourceDex: '',
      destinationDex: '',
      token: 'USDC',
      amount: '15.0',
      usdcValue: '15.0',
      fee: '0.0',
      nativeTokenFee: '0.0',
      nonce: 1762829270081,
      feeToken: ''
    }
  },
  {
    time: 1762829463681,
    hash: '0x6e2e9fb3e792d9306fa8041b74bf3a011700b7998295f80211f74b06a696b31b',
    delta: { type: 'accountClassTransfer', usdc: '5.0', toPerp: false }
  },
  {
    time: 1762829518878,
    hash: '0xee4c491f1b9b2213efc6041b74c0870116006104b69e40e59214f471da9efbfe',
    delta: { type: 'accountClassTransfer', usdc: '5.0', toPerp: false }
  },
  {
    time: 1762831062233,
    hash: '0x890873912fa569428a82041b74e39d0111008b76caa888142cd11ee3eea9432d',
    delta: { type: 'accountClassTransfer', usdc: '10.0', toPerp: false }
  },
  {
    time: 1762833525002,
    hash: '0xe3be8948bcd12990e538041b751b6c011100a12e57d448628787349b7bd5037b',
    delta: {
      type: 'send',
      user: '0x7787794d6f3d2f71ba02d51aec2265aa09d86cb9',
      destination: '0x17f51b528a0ea0ea19aba0f343dc9beed0fcc428',
      sourceDex: '',
      destinationDex: '',
      token: 'USDC',
      amount: '50.0',
      usdcValue: '50.0',
      fee: '0.0',
      nativeTokenFee: '0.0',
      nonce: 1762833515003,
      feeToken: ''
    }
  },
  {
    time: 1762833584557,
    hash: '0xdf1f3d7824e587f6e098041b751cc2010c00555dbfe8a6c882e7e8cae3e961e1',
    delta: { type: 'accountClassTransfer', usdc: '5.0', toPerp: false }
  }
]
```

## Open Orders E2E Tests

This test will work on both Hyperliquid mainnet and testnet.

Running this test will fetch all open orders (Spot and Perp) for the Agent Wallet PKP, and log them to the console. This test suite doesn't actually assert anything, it's just a convenience function to view the open orders of the Agent Wallet PKP.

```
pnpx nx run ability-hyperliquid:test-e2e packages/apps/ability-hyperliquid/test/e2e/open-orders.spec.ts
```

You should see something similar to the following logs indicating there are open orders for the Agent Wallet PKP:

```
[Open Orders] Full open orders response: [
  {
    coin: 'PURR/USDC',
    side: 'A',
    limitPx: '20.0',
    sz: '1.0',
    oid: 42821777260,
    timestamp: 1762840974157,
    origSz: '1.0'
  }
]
```

## Transfer to Perp E2E Tests

This test will work on both Hyperliquid mainnet and testnet.

This test will transfer USDC from the Agent Wallet PKP's Hyperliquid spot balance to it's Hyperliquid Perp balance. The PKP must have at least a Spot balance of `USDC_TRANSFER_AMOUNT` USDC.

```
pnpx nx run ability-hyperliquid:test-e2e packages/apps/ability-hyperliquid/test/e2e/transfer/to-perp.spec.ts
```

You should see the following logs indicating the transfer from the Spot balance to the Perp balance was successful:

```
[Perps] Clearinghouse state after transfer {
  marginSummary: {
    accountValue: '54.0',
    totalNtlPos: '0.0',
    totalRawUsd: '54.0',
    totalMarginUsed: '0.0'
  },
  crossMarginSummary: {
    accountValue: '54.0',
    totalNtlPos: '0.0',
    totalRawUsd: '54.0',
    totalMarginUsed: '0.0'
  },
  crossMaintenanceMarginUsed: '0.0',
  withdrawable: '54.0',
  assetPositions: [],
  time: 1762842914141
}
[Perps] Initial balance: 45.0
[Perps] Final balance: 54.0
[Perps] Expected increase: 9
[Perps] Actual increase: 9
```

## Perp Long E2E Tests

This test will work on both Hyperliquid mainnet and testnet.

This test will open a long position for the token specified by `PERP_SYMBOL` using USDC. The Agent Wallet PKP must have at least a Perp balance of `PERP_LONG_USD_NOTIONAL` USDC.

Note: opening a short position while the Agent Wallet PKP has a long position will result in the long position being decreased or cancelled out.

```
pnpx nx run ability-hyperliquid:test-e2e packages/apps/ability-hyperliquid/test/e2e/perp/long.spec.ts
```

You should see the following logs indicating the Perp Long was successful:

```
[Perp Long] State after long {
  marginSummary: {
    accountValue: '53.98844',
    totalNtlPos: '13.2408',
    totalRawUsd: '40.74764',
    totalMarginUsed: '6.6204'
  },
  crossMarginSummary: {
    accountValue: '53.98844',
    totalNtlPos: '13.2408',
    totalRawUsd: '40.74764',
    totalMarginUsed: '6.6204'
  },
  crossMaintenanceMarginUsed: '0.66204',
  withdrawable: '47.36804',
  assetPositions: [
    {
      type: 'oneWay',
      position: {
        coin: 'SOL',
        szi: '0.08',
        leverage: { type: 'cross', value: 2 },
        entryPx: '165.58',
        positionValue: '13.2408',
        unrealizedPnl: '-0.0056',
        returnOnEquity: '-0.0008455127',
        liquidationPx: null,
        marginUsed: '6.6204',
        maxLeverage: 10,
        cumFunding: { allTime: '0.0', sinceOpen: '0.0', sinceChange: '0.0' }
      }
    }
  ],
  time: 1762843035929
}
[Perp Long] Initial position size: 0
[Perp Long] Final position size: 0.08
[Perp Long] Position value: 13.2408
[Perp Long] Unrealized PnL: -0.0056
[Perp Long] Initial account value: 54.0
[Perp Long] Final account value: 53.98844
```

Note: you can pass the `reduceOnly` flag when calling `execute` to close a short position without worrying about the exact size:

```ts
const executeResult = await hyperliquidAbilityClient.execute(
  {
    action: HyperliquidAction.PERP_LONG,
    useTestnet: USE_TESTNET,
    perp: {
      symbol: PERP_SYMBOL,
      price: longPrice,
      size: longSize,
      leverage: LEVERAGE,
      isCross: IS_CROSS,
      reduceOnly: true, // <---
      orderType: { type: OrderType.MARKET },
    },
  },
  {
    delegatorPkpEthAddress: agentPkpInfo.ethAddress,
  },
);
```

Note: if you open a position using `OrderType.MARKET`, your order is likely to be immediately filled. If you want to see your open position, use the [Balance E2E Tests](#balance-e2e-tests) to check the Perp position of the Agent Wallet PKP:

```
[Perp Balance] Full perp state: {
  marginSummary: {
    accountValue: '54.025312',
    totalNtlPos: '36.322',
    totalRawUsd: '90.347312',
    totalMarginUsed: '18.161'
  },
  crossMarginSummary: {
    accountValue: '54.025312',
    totalNtlPos: '36.322',
    totalRawUsd: '90.347312',
    totalMarginUsed: '18.161'
  },
  crossMaintenanceMarginUsed: '1.8161',
  withdrawable: '35.864312',
  assetPositions: [
    {
      type: 'oneWay',
      position: {
        coin: 'SOL',
        szi: '-0.22',
        leverage: { type: 'cross', value: 2 },
        entryPx: '165.38',
        positionValue: '36.322',
        unrealizedPnl: '0.0616',
        returnOnEquity: '0.003386141',
        liquidationPx: '391.1139047619',
        marginUsed: '18.161',
        maxLeverage: 10,
        cumFunding: { allTime: '0.0', sinceOpen: '0.0', sinceChange: '0.0' }
      }
    }
  ],
  time: 1762844136785
}
```

## Perp Short E2E Tests

This test will work on both Hyperliquid mainnet and testnet.

This test will open short position for the token specified by `PERP_SYMBOL` using USDC. The Agent Wallet PKP must have at least a Perp balance of `PERP_SHORT_USD_NOTIONAL` USDC.

Note: opening a short position while the Agent Wallet PKP has a long position will result in the long position being decreased or cancelled out.

```
pnpx nx run ability-hyperliquid:test-e2e packages/apps/ability-hyperliquid/test/e2e/perp/short.spec.ts
```

You should see the following logs indicating the Perp Short was successful:

```
[Perp Short] State after short {
  marginSummary: {
    accountValue: '53.978594',
    totalNtlPos: '3.3096',
    totalRawUsd: '57.288194',
    totalMarginUsed: '1.6548'
  },
  crossMarginSummary: {
    accountValue: '53.978594',
    totalNtlPos: '3.3096',
    totalRawUsd: '57.288194',
    totalMarginUsed: '1.6548'
  },
  crossMaintenanceMarginUsed: '0.16548',
  withdrawable: '52.323794',
  assetPositions: [
    {
      type: 'oneWay',
      position: {
        coin: 'SOL',
        szi: '-0.02',
        leverage: { type: 'cross', value: 2 },
        entryPx: '165.48',
        positionValue: '3.3096',
        unrealizedPnl: '0.0',
        returnOnEquity: '0.0',
        liquidationPx: '2728.0092380952',
        marginUsed: '1.6548',
        maxLeverage: 10,
        cumFunding: { allTime: '0.0', sinceOpen: '0.0', sinceChange: '0.0' }
      }
    }
  ],
  time: 1762843337806
}
[Perp Short] Initial position size: 0.08
[Perp Short] Final position size: -0.02
[Perp Short] Position value: 3.3096
[Perp Short] Unrealized PnL: 0.0
[Perp Short] Initial account value: 53.99324
[Perp Short] Final account value: 53.978594
```

Note: you can pass the `reduceOnly` flag when calling `execute` to close a long position without worrying about the exact size:

```ts
const executeResult = await hyperliquidAbilityClient.execute(
  {
    action: HyperliquidAction.PERP_SHORT,
    useTestnet: USE_TESTNET,
    perp: {
      symbol: PERP_SYMBOL,
      price: shortPrice,
      size: shortSize,
      leverage: LEVERAGE,
      isCross: IS_CROSS,
      reduceOnly: true, // <---
      orderType: { type: OrderType.MARKET },
    },
  },
  {
    delegatorPkpEthAddress: agentPkpInfo.ethAddress,
  },
);
```

Note: if you open a position using `OrderType.MARKET`, your order is likely to be immediately filled. If you want to see your open position, use the [Balance E2E Tests](#balance-e2e-tests) to check the Perp position of the Agent Wallet PKP:

```
[Perp Balance] Full perp state: {
  marginSummary: {
    accountValue: '54.025312',
    totalNtlPos: '36.322',
    totalRawUsd: '90.347312',
    totalMarginUsed: '18.161'
  },
  crossMarginSummary: {
    accountValue: '54.025312',
    totalNtlPos: '36.322',
    totalRawUsd: '90.347312',
    totalMarginUsed: '18.161'
  },
  crossMaintenanceMarginUsed: '1.8161',
  withdrawable: '35.864312',
  assetPositions: [
    {
      type: 'oneWay',
      position: {
        coin: 'SOL',
        szi: '-0.22',
        leverage: { type: 'cross', value: 2 },
        entryPx: '165.38',
        positionValue: '36.322',
        unrealizedPnl: '0.0616',
        returnOnEquity: '0.003386141',
        liquidationPx: '391.1139047619',
        marginUsed: '18.161',
        maxLeverage: 10,
        cumFunding: { allTime: '0.0', sinceOpen: '0.0', sinceChange: '0.0' }
      }
    }
  ],
  time: 1762844136785
}
```
