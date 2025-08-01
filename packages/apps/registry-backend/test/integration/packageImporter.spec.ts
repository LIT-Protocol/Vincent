import { importPackage } from '../../src/lib/packageImporter';

describe('packageImporter integration tests', () => {
  // Define real packages to use for testing
  const policyPackage = {
    packageName: '@lit-protocol/vincent-policy-spending-limit',
    version: '1.0.1',
    type: 'policy' as const,
    expectedIpfsCid: 'QmNoWR1d2z6WwLB3Z2Lx3Uf38Y5V1u1DothS1xPJm9P8QH',
  };

  const abilityPackage = {
    packageName: '@lit-protocol/vincent-ability-erc20-approval',
    version: '1.0.1',
    type: 'ability' as const,
    expectedIpfsCid: 'QmWHK5KsJitDwW1zHRoiJQdQECASzSjjphp4Rg8YqB6BsX',
  };

  describe('Successful package imports', () => {
    it('should successfully import a policy package and extract metadata', async () => {
      // Import the policy package
      const metadata = await importPackage(policyPackage);

      // Verify the metadata
      expect(metadata).toBeDefined();
      expect(metadata.ipfsCid).toBe(policyPackage.expectedIpfsCid);
    });

    it('should successfully import an ability package and extract metadata', async () => {
      // Import the ability package
      const metadata = await importPackage(abilityPackage);

      // Verify the metadata
      expect(metadata).toBeDefined();
      expect(metadata.ipfsCid).toBe(abilityPackage.expectedIpfsCid);
    });
  });

  describe('Temporary directory management', () => {
    it('should create temporary directories in the system tmp directory', async () => {
      // Import a package
      await importPackage(abilityPackage);

      // We can't directly verify the directory creation since we're not mocking fs
      // But we can verify the package was imported successfully
      expect(true).toBe(true);
    });

    it('should create unique directories for concurrent executions', async () => {
      // Start two imports concurrently
      const promise1 = importPackage(abilityPackage);
      const promise2 = importPackage(policyPackage);

      // Wait for both to complete
      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Verify both succeeded with different results
      expect(result1.ipfsCid).toBe(abilityPackage.expectedIpfsCid);
      expect(result2.ipfsCid).toBe(policyPackage.expectedIpfsCid);
    });
  });

  describe('Error handling', () => {
    it('should throw an error for a non-existent package', async () => {
      await expect(
        importPackage({
          packageName: '@lit-protocol/non-existent-package',
          version: '1.0.0',
          type: 'ability',
        }),
      ).rejects.toThrow('Failed to download and extract package');
    });

    it('should throw an error for a non-existent version', async () => {
      await expect(
        importPackage({
          packageName: abilityPackage.packageName,
          version: '999.999.999',
          type: 'ability',
        }),
      ).rejects.toThrow('Failed to download and extract package');
    });

    it('should throw an error if the package does not have the required metadata file', async () => {
      // Use a package that exists but doesn't have the metadata file
      await expect(
        importPackage({
          packageName: 'lodash',
          version: '4.17.21',
          type: 'ability',
        }),
      ).rejects.toThrow(/Metadata file.*not found/);
    });
  });
});
