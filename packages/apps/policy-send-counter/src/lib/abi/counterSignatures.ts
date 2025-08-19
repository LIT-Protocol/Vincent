export const counterSignatures = {
  address: '0x91670f6ce98353815278b4b21f11222dec14fefe',
  methods: {
    counterByAddress: {
      type: 'function',
      name: 'counterByAddress',
      inputs: [
        {
          name: '',
          type: 'address',
          internalType: 'address',
        },
      ],
      outputs: [
        {
          name: '',
          type: 'uint256',
          internalType: 'uint256',
        },
      ],
      stateMutability: 'view',
    },
    getCounter: {
      type: 'function',
      name: 'getCounter',
      inputs: [
        {
          name: 'addr',
          type: 'address',
          internalType: 'address',
        },
      ],
      outputs: [
        {
          name: '',
          type: 'uint256',
          internalType: 'uint256',
        },
      ],
      stateMutability: 'view',
    },
    getLastIncrementTime: {
      type: 'function',
      name: 'getLastIncrementTime',
      inputs: [
        {
          name: 'addr',
          type: 'address',
          internalType: 'address',
        },
      ],
      outputs: [
        {
          name: '',
          type: 'uint256',
          internalType: 'uint256',
        },
      ],
      stateMutability: 'view',
    },
    increment: {
      type: 'function',
      name: 'increment',
      inputs: [],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    lastIncrementTime: {
      type: 'function',
      name: 'lastIncrementTime',
      inputs: [
        {
          name: '',
          type: 'address',
          internalType: 'address',
        },
      ],
      outputs: [
        {
          name: '',
          type: 'uint256',
          internalType: 'uint256',
        },
      ],
      stateMutability: 'view',
    },
    reset: {
      type: 'function',
      name: 'reset',
      inputs: [],
      outputs: [],
      stateMutability: 'nonpayable',
    },
  },
  events: [],
} as const;

export type CounterSignatures = typeof counterSignatures;
