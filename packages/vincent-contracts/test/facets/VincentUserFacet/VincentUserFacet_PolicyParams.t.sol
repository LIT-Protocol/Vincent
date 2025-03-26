// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "../../helpers/VincentTestHelper.sol";
import "../../../src/VincentBase.sol";
import "../../../src/LibVincentDiamondStorage.sol";

/**
 * @title VincentUserFacetTest
 * @notice Test contract for VincentUserFacet and VincentUserViewFacet
 * @dev Tests functions related to user registration and management
 */
contract VincentUserFacetTest is VincentTestHelper {
    // App ID and version for tests
    uint256 appId;
    uint256 appVersion;

    // Tool hash for tests
    bytes32 toolHash;

    function setUp() public override {
        // Call parent setUp to deploy the diamond and initialize standard test data
        super.setUp();

        // Register a test app for user tests
        vm.startPrank(deployer);
        (appId, appVersion) = _registerTestApp();
        vm.stopPrank();

        // Calculate tool hash for tests
        toolHash = keccak256(abi.encodePacked(TEST_TOOL_IPFS_CID_1));
    }

    /**
     * @notice Test setting a string policy parameter
     * @dev Verifies that a PKP owner can set a string policy parameter
     */
    function testSetStringPolicyParameter() public {
        // Start as deployer (owner of TEST_PKP_TOKEN_ID_1)
        vm.startPrank(deployer);

        bytes[][][] memory _testToolPolicyParameterValues = new bytes[][][](1);
        _testToolPolicyParameterValues[0] = new bytes[][](1);
        _testToolPolicyParameterValues[0][0] = new bytes[](1);
        _testToolPolicyParameterValues[0][0][0] = abi.encode(TEST_POLICY_PARAM_STRING_VALUE);

        // First permit app version
        wrappedUserFacet.permitAppVersion(
            TEST_PKP_TOKEN_ID_1,
            appId,
            appVersion,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            _testToolPolicyParameterValues
        );

        // Verify the parameter was set using the view facet
        VincentUserViewFacet.ToolWithPolicies[] memory toolsAndPolicies =
            wrappedUserViewFacet.getAllToolsAndPoliciesForApp(TEST_PKP_TOKEN_ID_1, appId);

        // Assert that the policy parameter value equals TEST_POLICY_PARAM_STRING_VALUE
        string memory paramValue = abi.decode(toolsAndPolicies[0].policies[0].parameters[0].value, (string));
        assertEq(paramValue, TEST_POLICY_PARAM_STRING_VALUE, "Policy parameter value should match the expected value");

        vm.stopPrank();
    }

    /**
     * @notice Test setting a string array policy parameter
     * @dev Verifies that a PKP owner can set a string array policy parameter
     */
    function testSetStringArrayPolicyParameter() public {
        // Start as deployer (owner of TEST_PKP_TOKEN_ID_1)
        vm.startPrank(deployer);

        bytes[][][] memory _testToolPolicyParameterValues = new bytes[][][](1);
        _testToolPolicyParameterValues[0] = new bytes[][](1);
        _testToolPolicyParameterValues[0][0] = new bytes[](1);
        _testToolPolicyParameterValues[0][0][0] = abi.encode(TEST_POLICY_PARAM_STRING_ARRAY_VALUE);

        // First permit app version
        wrappedUserFacet.permitAppVersion(
            TEST_PKP_TOKEN_ID_1,
            appId,
            appVersion,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            _testToolPolicyParameterValues
        );

        // Verify the parameter was set using the view facet
        VincentUserViewFacet.ToolWithPolicies[] memory toolsAndPolicies =
            wrappedUserViewFacet.getAllToolsAndPoliciesForApp(TEST_PKP_TOKEN_ID_1, appId);

        // Assert that the policy parameter value equals TEST_POLICY_PARAM_STRING_ARRAY_VALUE
        string[] memory paramValue = abi.decode(toolsAndPolicies[0].policies[0].parameters[0].value, (string[]));

        assertEq(paramValue.length, TEST_POLICY_PARAM_STRING_ARRAY_VALUE.length, "Array length should match");
        for (uint256 i = 0; i < paramValue.length; i++) {
            assertEq(paramValue[i], TEST_POLICY_PARAM_STRING_ARRAY_VALUE[i], "Array elements should match");
        }

        vm.stopPrank();
    }

    /**
     * @notice Test setting an int256 policy parameter
     */
    function testSetInt256PolicyParameter() public {
        vm.startPrank(deployer);

        bytes[][][] memory _testToolPolicyParameterValues = new bytes[][][](1);
        _testToolPolicyParameterValues[0] = new bytes[][](1);
        _testToolPolicyParameterValues[0][0] = new bytes[](1);
        _testToolPolicyParameterValues[0][0][0] = abi.encode(TEST_POLICY_PARAM_INT256_VALUE);

        wrappedUserFacet.permitAppVersion(
            TEST_PKP_TOKEN_ID_1,
            appId,
            appVersion,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            _testToolPolicyParameterValues
        );

        VincentUserViewFacet.ToolWithPolicies[] memory toolsAndPolicies =
            wrappedUserViewFacet.getAllToolsAndPoliciesForApp(TEST_PKP_TOKEN_ID_1, appId);

        int256 paramValue = abi.decode(toolsAndPolicies[0].policies[0].parameters[0].value, (int256));
        assertEq(paramValue, TEST_POLICY_PARAM_INT256_VALUE);

        vm.stopPrank();
    }

    /**
     * @notice Test setting an int256[] policy parameter
     */
    function testSetInt256ArrayPolicyParameter() public {
        vm.startPrank(deployer);

        bytes[][][] memory _testToolPolicyParameterValues = new bytes[][][](1);
        _testToolPolicyParameterValues[0] = new bytes[][](1);
        _testToolPolicyParameterValues[0][0] = new bytes[](1);
        _testToolPolicyParameterValues[0][0][0] = abi.encode(TEST_POLICY_PARAM_INT256_ARRAY_VALUE);

        wrappedUserFacet.permitAppVersion(
            TEST_PKP_TOKEN_ID_1,
            appId,
            appVersion,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            _testToolPolicyParameterValues
        );

        VincentUserViewFacet.ToolWithPolicies[] memory toolsAndPolicies =
            wrappedUserViewFacet.getAllToolsAndPoliciesForApp(TEST_PKP_TOKEN_ID_1, appId);

        int256[] memory paramValue = abi.decode(toolsAndPolicies[0].policies[0].parameters[0].value, (int256[]));
        assertEq(paramValue.length, TEST_POLICY_PARAM_INT256_ARRAY_VALUE.length);
        for (uint256 i = 0; i < paramValue.length; i++) {
            assertEq(paramValue[i], TEST_POLICY_PARAM_INT256_ARRAY_VALUE[i]);
        }

        vm.stopPrank();
    }

    /**
     * @notice Test setting a uint256 policy parameter
     */
    function testSetUint256PolicyParameter() public {
        vm.startPrank(deployer);

        bytes[][][] memory _testToolPolicyParameterValues = new bytes[][][](1);
        _testToolPolicyParameterValues[0] = new bytes[][](1);
        _testToolPolicyParameterValues[0][0] = new bytes[](1);
        _testToolPolicyParameterValues[0][0][0] = abi.encode(TEST_POLICY_PARAM_UINT256_VALUE);

        wrappedUserFacet.permitAppVersion(
            TEST_PKP_TOKEN_ID_1,
            appId,
            appVersion,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            _testToolPolicyParameterValues
        );

        VincentUserViewFacet.ToolWithPolicies[] memory toolsAndPolicies =
            wrappedUserViewFacet.getAllToolsAndPoliciesForApp(TEST_PKP_TOKEN_ID_1, appId);

        uint256 paramValue = abi.decode(toolsAndPolicies[0].policies[0].parameters[0].value, (uint256));
        assertEq(paramValue, TEST_POLICY_PARAM_UINT256_VALUE);

        vm.stopPrank();
    }

    /**
     * @notice Test setting a uint256[] policy parameter
     */
    function testSetUint256ArrayPolicyParameter() public {
        vm.startPrank(deployer);

        bytes[][][] memory _testToolPolicyParameterValues = new bytes[][][](1);
        _testToolPolicyParameterValues[0] = new bytes[][](1);
        _testToolPolicyParameterValues[0][0] = new bytes[](1);
        _testToolPolicyParameterValues[0][0][0] = abi.encode(TEST_POLICY_PARAM_UINT256_ARRAY_VALUE);

        wrappedUserFacet.permitAppVersion(
            TEST_PKP_TOKEN_ID_1,
            appId,
            appVersion,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            _testToolPolicyParameterValues
        );

        VincentUserViewFacet.ToolWithPolicies[] memory toolsAndPolicies =
            wrappedUserViewFacet.getAllToolsAndPoliciesForApp(TEST_PKP_TOKEN_ID_1, appId);

        uint256[] memory paramValue = abi.decode(toolsAndPolicies[0].policies[0].parameters[0].value, (uint256[]));
        assertEq(paramValue.length, TEST_POLICY_PARAM_UINT256_ARRAY_VALUE.length);
        for (uint256 i = 0; i < paramValue.length; i++) {
            assertEq(paramValue[i], TEST_POLICY_PARAM_UINT256_ARRAY_VALUE[i]);
        }

        vm.stopPrank();
    }

    /**
     * @notice Test setting a bool policy parameter
     */
    function testSetBoolPolicyParameter() public {
        vm.startPrank(deployer);

        bytes[][][] memory _testToolPolicyParameterValues = new bytes[][][](1);
        _testToolPolicyParameterValues[0] = new bytes[][](1);
        _testToolPolicyParameterValues[0][0] = new bytes[](1);
        _testToolPolicyParameterValues[0][0][0] = abi.encode(TEST_POLICY_PARAM_BOOL_VALUE);

        wrappedUserFacet.permitAppVersion(
            TEST_PKP_TOKEN_ID_1,
            appId,
            appVersion,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            _testToolPolicyParameterValues
        );

        VincentUserViewFacet.ToolWithPolicies[] memory toolsAndPolicies =
            wrappedUserViewFacet.getAllToolsAndPoliciesForApp(TEST_PKP_TOKEN_ID_1, appId);

        bool paramValue = abi.decode(toolsAndPolicies[0].policies[0].parameters[0].value, (bool));
        assertEq(paramValue, TEST_POLICY_PARAM_BOOL_VALUE);

        vm.stopPrank();
    }

    /**
     * @notice Test setting a bool[] policy parameter
     */
    function testSetBoolArrayPolicyParameter() public {
        vm.startPrank(deployer);

        bytes[][][] memory _testToolPolicyParameterValues = new bytes[][][](1);
        _testToolPolicyParameterValues[0] = new bytes[][](1);
        _testToolPolicyParameterValues[0][0] = new bytes[](1);
        _testToolPolicyParameterValues[0][0][0] = abi.encode(TEST_POLICY_PARAM_BOOL_ARRAY_VALUE);

        wrappedUserFacet.permitAppVersion(
            TEST_PKP_TOKEN_ID_1,
            appId,
            appVersion,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            _testToolPolicyParameterValues
        );

        VincentUserViewFacet.ToolWithPolicies[] memory toolsAndPolicies =
            wrappedUserViewFacet.getAllToolsAndPoliciesForApp(TEST_PKP_TOKEN_ID_1, appId);

        bool[] memory paramValue = abi.decode(toolsAndPolicies[0].policies[0].parameters[0].value, (bool[]));
        assertEq(paramValue.length, TEST_POLICY_PARAM_BOOL_ARRAY_VALUE.length);
        for (uint256 i = 0; i < paramValue.length; i++) {
            assertEq(paramValue[i], TEST_POLICY_PARAM_BOOL_ARRAY_VALUE[i]);
        }

        vm.stopPrank();
    }

    /**
     * @notice Test setting an address policy parameter
     */
    function testSetAddressPolicyParameter() public {
        vm.startPrank(deployer);

        bytes[][][] memory _testToolPolicyParameterValues = new bytes[][][](1);
        _testToolPolicyParameterValues[0] = new bytes[][](1);
        _testToolPolicyParameterValues[0][0] = new bytes[](1);
        _testToolPolicyParameterValues[0][0][0] = abi.encode(TEST_POLICY_PARAM_ADDRESS_VALUE);

        wrappedUserFacet.permitAppVersion(
            TEST_PKP_TOKEN_ID_1,
            appId,
            appVersion,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            _testToolPolicyParameterValues
        );

        VincentUserViewFacet.ToolWithPolicies[] memory toolsAndPolicies =
            wrappedUserViewFacet.getAllToolsAndPoliciesForApp(TEST_PKP_TOKEN_ID_1, appId);

        address paramValue = abi.decode(toolsAndPolicies[0].policies[0].parameters[0].value, (address));
        assertEq(paramValue, TEST_POLICY_PARAM_ADDRESS_VALUE);

        vm.stopPrank();
    }

    /**
     * @notice Test setting an address[] policy parameter
     */
    function testSetAddressArrayPolicyParameter() public {
        vm.startPrank(deployer);

        bytes[][][] memory _testToolPolicyParameterValues = new bytes[][][](1);
        _testToolPolicyParameterValues[0] = new bytes[][](1);
        _testToolPolicyParameterValues[0][0] = new bytes[](1);
        _testToolPolicyParameterValues[0][0][0] = abi.encode(TEST_POLICY_PARAM_ADDRESS_ARRAY_VALUE);

        wrappedUserFacet.permitAppVersion(
            TEST_PKP_TOKEN_ID_1,
            appId,
            appVersion,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            _testToolPolicyParameterValues
        );

        VincentUserViewFacet.ToolWithPolicies[] memory toolsAndPolicies =
            wrappedUserViewFacet.getAllToolsAndPoliciesForApp(TEST_PKP_TOKEN_ID_1, appId);

        address[] memory paramValue = abi.decode(toolsAndPolicies[0].policies[0].parameters[0].value, (address[]));
        assertEq(paramValue.length, TEST_POLICY_PARAM_ADDRESS_ARRAY_VALUE.length);
        for (uint256 i = 0; i < paramValue.length; i++) {
            assertEq(paramValue[i], TEST_POLICY_PARAM_ADDRESS_ARRAY_VALUE[i]);
        }

        vm.stopPrank();
    }

    /**
     * @notice Test setting a bytes policy parameter
     */
    function testSetBytesPolicyParameter() public {
        vm.startPrank(deployer);

        bytes[][][] memory _testToolPolicyParameterValues = new bytes[][][](1);
        _testToolPolicyParameterValues[0] = new bytes[][](1);
        _testToolPolicyParameterValues[0][0] = new bytes[](1);
        _testToolPolicyParameterValues[0][0][0] = abi.encode(TEST_POLICY_PARAM_BYTES_VALUE);

        wrappedUserFacet.permitAppVersion(
            TEST_PKP_TOKEN_ID_1,
            appId,
            appVersion,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            _testToolPolicyParameterValues
        );

        VincentUserViewFacet.ToolWithPolicies[] memory toolsAndPolicies =
            wrappedUserViewFacet.getAllToolsAndPoliciesForApp(TEST_PKP_TOKEN_ID_1, appId);

        bytes memory paramValue = abi.decode(toolsAndPolicies[0].policies[0].parameters[0].value, (bytes));
        assertEq(keccak256(paramValue), keccak256(TEST_POLICY_PARAM_BYTES_VALUE));

        vm.stopPrank();
    }

    /**
     * @notice Test setting a bytes[] policy parameter
     */
    function testSetBytesArrayPolicyParameter() public {
        vm.startPrank(deployer);

        bytes[][][] memory _testToolPolicyParameterValues = new bytes[][][](1);
        _testToolPolicyParameterValues[0] = new bytes[][](1);
        _testToolPolicyParameterValues[0][0] = new bytes[](1);
        _testToolPolicyParameterValues[0][0][0] = abi.encode(TEST_POLICY_PARAM_BYTES_ARRAY_VALUE);

        wrappedUserFacet.permitAppVersion(
            TEST_PKP_TOKEN_ID_1,
            appId,
            appVersion,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            _testToolPolicyParameterValues
        );

        VincentUserViewFacet.ToolWithPolicies[] memory toolsAndPolicies =
            wrappedUserViewFacet.getAllToolsAndPoliciesForApp(TEST_PKP_TOKEN_ID_1, appId);

        bytes[] memory paramValue = abi.decode(toolsAndPolicies[0].policies[0].parameters[0].value, (bytes[]));
        assertEq(paramValue.length, TEST_POLICY_PARAM_BYTES_ARRAY_VALUE.length);
        for (uint256 i = 0; i < paramValue.length; i++) {
            assertEq(keccak256(paramValue[i]), keccak256(TEST_POLICY_PARAM_BYTES_ARRAY_VALUE[i]));
        }

        vm.stopPrank();
    }

    /**
     * @notice Test that setting tool policy parameters with duplicate parameter names reverts
     * @dev This test verifies that the contract correctly rejects duplicate parameter names within the same policy
     */
    function testRevertWhenDuplicateParameterNames() public {
        vm.startPrank(deployer);

        // Create parameter arrays with duplicate parameter names
        string[][][] memory _duplicateParameterNames = new string[][][](1);
        _duplicateParameterNames[0] = new string[][](1);
        _duplicateParameterNames[0][0] = new string[](2);
        _duplicateParameterNames[0][0][0] = "param1";
        _duplicateParameterNames[0][0][1] = "param1"; // Same name as the first parameter

        bytes[][][] memory _parameterValues = new bytes[][][](1);
        _parameterValues[0] = new bytes[][](1);
        _parameterValues[0][0] = new bytes[](2);
        _parameterValues[0][0][0] = abi.encode("value1");
        _parameterValues[0][0][1] = abi.encode("value2");

        // Expect revert with DuplicateParameterNameNotAllowed error
        vm.expectRevert(
            abi.encodeWithSelector(
                VincentUserFacet.DuplicateParameterNameNotAllowed.selector,
                appId,
                0, // toolIndex
                0, // policyIndex
                "param1",
                0, // firstIndex
                1 // duplicateIndex
            )
        );

        wrappedUserFacet.setToolPolicyParameters(
            TEST_PKP_TOKEN_ID_1,
            appId,
            appVersion,
            testToolIpfsCids,
            testToolPolicies,
            _duplicateParameterNames,
            _parameterValues
        );

        vm.stopPrank();
    }

    /**
     * @notice Test that setting tool policy parameters with mismatched policy arrays reverts
     * @dev This test verifies that the contract rejects input where policy arrays have different lengths
     */
    function testRevertWhenPolicyArrayLengthMismatch() public {
        vm.startPrank(deployer);

        // Create arrays with mismatched policy lengths
        string[][] memory _policies = new string[][](1);
        _policies[0] = new string[](1);
        _policies[0][0] = TEST_POLICY_1;

        string[][][] memory _parameterNames = new string[][][](1);
        _parameterNames[0] = new string[][](2); // 2 policies but only 1 defined above
        _parameterNames[0][0] = new string[](1);
        _parameterNames[0][0][0] = TEST_POLICY_PARAM_1;
        _parameterNames[0][1] = new string[](1);
        _parameterNames[0][1][0] = TEST_POLICY_PARAM_2;

        bytes[][][] memory _parameterValues = new bytes[][][](1);
        _parameterValues[0] = new bytes[][](1); // 1 policy, doesn't match parameter names
        _parameterValues[0][0] = new bytes[](1);
        _parameterValues[0][0][0] = abi.encode("value");

        // Expect revert with PolicyArrayLengthMismatch error
        vm.expectRevert(
            abi.encodeWithSelector(
                VincentUserFacet.PolicyArrayLengthMismatch.selector,
                0, // toolIndex
                1, // policiesLength
                2, // paramNamesLength
                1 // paramValuesLength
            )
        );

        wrappedUserFacet.setToolPolicyParameters(
            TEST_PKP_TOKEN_ID_1, appId, appVersion, testToolIpfsCids, _policies, _parameterNames, _parameterValues
        );

        vm.stopPrank();
    }

    /**
     * @notice Test that setting tool policy parameters with mismatched parameter arrays reverts
     * @dev This test verifies that the contract rejects input where parameter arrays have different lengths
     */
    function testRevertWhenParameterArrayLengthMismatch() public {
        vm.startPrank(deployer);

        // Create arrays with mismatched parameter lengths
        string[][][] memory _parameterNames = new string[][][](1);
        _parameterNames[0] = new string[][](1);
        _parameterNames[0][0] = new string[](2); // 2 parameters
        _parameterNames[0][0][0] = TEST_POLICY_PARAM_1;
        _parameterNames[0][0][1] = TEST_POLICY_PARAM_2;

        bytes[][][] memory _parameterValues = new bytes[][][](1);
        _parameterValues[0] = new bytes[][](1);
        _parameterValues[0][0] = new bytes[](1); // Only 1 parameter value - mismatch
        _parameterValues[0][0][0] = abi.encode("value");

        // Expect revert with ParameterArrayLengthMismatch error
        vm.expectRevert(
            abi.encodeWithSelector(
                VincentUserFacet.ParameterArrayLengthMismatch.selector,
                0, // toolIndex
                0, // policyIndex
                2, // paramNamesLength
                1 // paramValuesLength
            )
        );

        wrappedUserFacet.setToolPolicyParameters(
            TEST_PKP_TOKEN_ID_1,
            appId,
            appVersion,
            testToolIpfsCids,
            testToolPolicies,
            _parameterNames,
            _parameterValues
        );

        vm.stopPrank();
    }

    /**
     * @notice Test that removeToolPolicyParameters reverts when policy arrays have mismatched lengths
     * @dev This test verifies that the contract rejects input where policy arrays have different lengths
     */
    function testRevertWhenRemovingWithPolicyArrayLengthMismatch() public {
        vm.startPrank(deployer);

        // First permit app version to set up parameters to remove
        wrappedUserFacet.permitAppVersion(
            TEST_PKP_TOKEN_ID_1,
            appId,
            appVersion,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            testToolPolicyParameterValues
        );

        // Create arrays with mismatched policy lengths
        string[][] memory _policies = new string[][](1);
        _policies[0] = new string[](1);
        _policies[0][0] = TEST_POLICY_1;

        string[][][] memory _parameterNames = new string[][][](1);
        _parameterNames[0] = new string[][](2); // 2 policies but only 1 defined above
        _parameterNames[0][0] = new string[](1);
        _parameterNames[0][0][0] = TEST_POLICY_PARAM_1;
        _parameterNames[0][1] = new string[](1);
        _parameterNames[0][1][0] = TEST_POLICY_PARAM_2;

        // Expect revert with PolicyArrayLengthMismatch error
        vm.expectRevert(
            abi.encodeWithSelector(
                VincentUserFacet.PolicyArrayLengthMismatch.selector,
                0, // toolIndex
                1, // policiesLength
                2, // paramNamesLength
                0 // paramValuesLength (0 because not used in removeToolPolicyParameters)
            )
        );

        wrappedUserFacet.removeToolPolicyParameters(
            appId, TEST_PKP_TOKEN_ID_1, appVersion, testToolIpfsCids, _policies, _parameterNames
        );

        vm.stopPrank();
    }

    /**
     * @notice Test that removeToolPolicyParameters reverts when duplicate parameter names are provided
     * @dev This test verifies that the contract correctly rejects duplicate parameter names within the same policy
     */
    function testRevertWhenRemovingWithDuplicateParameterNames() public {
        vm.startPrank(deployer);

        // First permit app version to set up parameters to remove
        wrappedUserFacet.permitAppVersion(
            TEST_PKP_TOKEN_ID_1,
            appId,
            appVersion,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            testToolPolicyParameterValues
        );

        // Create parameter arrays with duplicate parameter names
        string[][][] memory _duplicateParameterNames = new string[][][](1);
        _duplicateParameterNames[0] = new string[][](1);
        _duplicateParameterNames[0][0] = new string[](2);
        _duplicateParameterNames[0][0][0] = "param1";
        _duplicateParameterNames[0][0][1] = "param1"; // Same name as the first parameter

        // Expect revert with DuplicateParameterNameNotAllowed error
        vm.expectRevert(
            abi.encodeWithSelector(
                VincentUserFacet.DuplicateParameterNameNotAllowed.selector,
                appId,
                0, // toolIndex
                0, // policyIndex
                "param1",
                0, // firstIndex
                1 // duplicateIndex
            )
        );

        wrappedUserFacet.removeToolPolicyParameters(
            appId, TEST_PKP_TOKEN_ID_1, appVersion, testToolIpfsCids, testToolPolicies, _duplicateParameterNames
        );

        vm.stopPrank();
    }
}
