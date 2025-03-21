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
}
