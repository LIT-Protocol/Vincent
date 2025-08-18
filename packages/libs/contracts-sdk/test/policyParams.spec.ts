import { encode as cborEncode } from 'cbor2';
import { hexlify } from 'ethers/lib/utils';

import type { PermissionData, DeletePermissionData } from '../src/types';

import { encodePermissionDataForChain } from '../src/utils/policyParams';

describe('encodePermissionDataForChain', () => {
  it('throws when PermissionData and DeletePermissionData share the same ability key', () => {
    const permissionData: PermissionData = {
      abilityA: {
        policy1: { a: 1 },
      },
    };

    const deletePermissionData: DeletePermissionData = {
      abilityA: ['policyX'],
    };

    expect(() => encodePermissionDataForChain(permissionData, deletePermissionData)).toThrow(
      /deletePermissionData contains ability abilityA/,
    );
  });

  it('sets deleted policy entries to 0x in the output (deletion-only)', () => {
    const deletePermissionData: DeletePermissionData = {
      abilityA: ['policy1', 'policy2'],
      abilityB: ['policy3'],
    };

    const result = encodePermissionDataForChain(undefined, deletePermissionData);

    // Order should follow: keys from permissionData (none) then keys from deletePermissionData
    expect(result.abilityIpfsCids).toEqual(['abilityA', 'abilityB']);
    expect(result.policyIpfsCids).toEqual([['policy1', 'policy2'], ['policy3']]);
    expect(result.policyParameterValues).toEqual([['0x', '0x'], ['0x']]);
  });

  it('encodes updates to CBOR2 hex values', () => {
    const permissionData: PermissionData = {
      abilityA: {
        policy1: { foo: 'bar' },
        // explicit undefined should be allowed and encoded as CBOR undefined
        policy2: undefined,
      },
      abilityB: {
        policy3: { count: 123 },
      },
    };

    const result = encodePermissionDataForChain(permissionData);

    // Compute expected encodings using the same CBOR2 encoder for precise matching
    const expectedPolicy1 = hexlify(cborEncode({ foo: 'bar' }));
    const expectedPolicy2 = hexlify(cborEncode(undefined));
    const expectedPolicy3 = hexlify(cborEncode({ count: 123 }));

    expect(result.abilityIpfsCids).toEqual(['abilityA', 'abilityB']);
    expect(result.policyIpfsCids).toEqual([['policy1', 'policy2'], ['policy3']]);
    expect(result.policyParameterValues).toEqual([
      [expectedPolicy1, expectedPolicy2],
      [expectedPolicy3],
    ]);
  });

  it('maintains correct positional ordering and alignment for mixed updates and deletions', () => {
    // permissionData first keys followed by deletePermissionData-only ability keys
    const permissionData: PermissionData = {
      ability1: {
        polA: { x: 1 },
      },
      ability2: {
        polB: { y: 2 },
      },
    };

    const deletePermissionData: DeletePermissionData = {
      ability3: ['polC', 'polD'],
    };

    const result = encodePermissionDataForChain(permissionData, deletePermissionData);

    // Combined key order: Object.keys(permissionData) then Object.keys(deletePermissionData)
    expect(result.abilityIpfsCids).toEqual(['ability1', 'ability2', 'ability3']);

    // Ensure inner arrays are aligned index-by-index
    expect(result.policyIpfsCids.length).toBe(3);
    expect(result.policyParameterValues.length).toBe(3);

    // ability1 updates
    expect(result.policyIpfsCids[0]).toEqual(['polA']);
    const expectedPolA = hexlify(cborEncode({ x: 1 }));
    expect(result.policyParameterValues[0]).toEqual([expectedPolA]);

    // ability2 updates
    expect(result.policyIpfsCids[1]).toEqual(['polB']);
    const expectedPolB = hexlify(cborEncode({ y: 2 }));
    expect(result.policyParameterValues[1]).toEqual([expectedPolB]);

    // ability3 deletions
    expect(result.policyIpfsCids[2]).toEqual(['polC', 'polD']);
    expect(result.policyParameterValues[2]).toEqual(['0x', '0x']);
  });

  it('handles permissionData being optional when only deletions are provided', () => {
    const deletePermissionData: DeletePermissionData = {
      abilityX: ['policyZ'],
    };

    const result = encodePermissionDataForChain(undefined, deletePermissionData);

    expect(result.abilityIpfsCids).toEqual(['abilityX']);
    expect(result.policyIpfsCids).toEqual([['policyZ']]);
    expect(result.policyParameterValues).toEqual([['0x']]);
  });
});
