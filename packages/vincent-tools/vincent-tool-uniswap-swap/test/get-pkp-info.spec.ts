import { getPkpInfo } from '../src/lib/tool-helpers/get-pkp-info';

describe('getPkpInfo', () => {
  const pkpEthAddress = '0xC41ECf8D3A8701F8EC68cb2093C55Ed35b429d51' as `0x${string}`;
  const expectedTokenId =
    2295116895976718763601919367943663688675088303098605991932427771345328475924n;
  const expectedPublicKey =
    '0x04fcaa5cf1a63d0dbf92e5ea81603e428bfc12818a168ba82e6032f649b48365d938bb7e40486d19e469e9a0de2369de0c2d85af3a29208dd7c1693ba438c64949';

  it('should get PKP info for a valid PKP ETH address', async () => {
    // Execute
    const result = await getPkpInfo({
      pkpEthAddress,
    });

    // Assert
    expect(result).toBeDefined();
    expect(result.ethAddress).toBe(pkpEthAddress);
    expect(result.tokenId).toBe(expectedTokenId);
    expect(result.publicKey).toBe(expectedPublicKey);
  });
});
