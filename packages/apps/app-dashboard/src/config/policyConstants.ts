interface PolicyMetadata {
  description: string;
}

type IPFSPoliciesMap = Record<string, PolicyMetadata>;

export const IPFS_POLICIES_THAT_NEED_SIGNING: IPFSPoliciesMap = {
  'QmZrG2DFvVDgo3hZgpUn31TUgrHYfLQA2qEpAo3tnKmzhQ': { description: 'DCA Spending Limit Policy' },
};
