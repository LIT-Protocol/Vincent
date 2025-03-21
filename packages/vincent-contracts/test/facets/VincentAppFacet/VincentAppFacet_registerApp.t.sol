// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "../../helpers/VincentTestHelper.sol";
import "../../../src/VincentBase.sol";
import "../../../src/LibVincentDiamondStorage.sol";

/**
 * @title VincentAppFacetTest
 * @notice Test contract for VincentAppFacet
 * @dev Tests functions related to app registration and management
 */
contract VincentAppFacetTest is VincentTestHelper {
    function setUp() public override {
        // Call parent setUp to deploy the diamond and initialize standard test data
        super.setUp();
    }

    /**
     * @notice Test registering a new app
     * @dev Verifies that an app can be registered with all required details
     */
    function testRegisterApp() public {
        // Start as deployer (diamond owner)
        vm.startPrank(deployer);

        // Expect the NewAppRegistered and NewAppVersionRegistered events
        vm.expectEmit(true, true, false, false);
        emit NewAppRegistered(1, deployer);

        vm.expectEmit(true, true, true, false);
        emit NewAppVersionRegistered(1, 1, deployer);

        // Call registerApp through the diamond with the test data from the test helper
        (uint256 appId, uint256 versionNumber) = wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            testRedirectUris,
            testDelegatees,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        // Verify returned values
        assertEq(appId, 1, "App ID should be 1");
        assertEq(versionNumber, 1, "App version should be 1");

        // Verify app data was stored correctly by checking view functions
        VincentAppViewFacet.App memory app = wrappedAppViewFacet.getAppById(appId);
        assertEq(
            keccak256(abi.encodePacked(app.name)), keccak256(abi.encodePacked(TEST_APP_NAME)), "App name should match"
        );
        assertEq(
            keccak256(abi.encodePacked(app.description)),
            keccak256(abi.encodePacked(TEST_APP_DESCRIPTION)),
            "App description should match"
        );
        assertEq(app.manager, deployer, "App manager should be deployer");

        // Verify app version is enabled
        (VincentAppViewFacet.App memory appData, VincentAppViewFacet.AppVersion memory versionData) =
            wrappedAppViewFacet.getAppVersion(appId, versionNumber);
        assertTrue(versionData.enabled, "App version should be enabled");

        // Verify delegatee was added
        assertEq(app.delegatees.length, 1, "Should have 1 delegatee");
        assertEq(app.delegatees[0], TEST_DELEGATEE_1, "Delegatee should match");

        // Verify redirect URI was added
        string[] memory appRedirectUris = wrappedAppViewFacet.getAuthorizedRedirectUrisByAppId(appId);
        assertEq(appRedirectUris.length, 1, "Should have 1 redirect URI");
        assertEq(
            keccak256(abi.encodePacked(appRedirectUris[0])),
            keccak256(abi.encodePacked(TEST_REDIRECT_URI_1)),
            "Redirect URI should match"
        );

        // Verify tools were correctly registered
        assertEq(versionData.tools.length, 1, "App version should have 1 tool");

        vm.stopPrank();
    }

    /**
     * @notice Test registering multiple apps sequentially
     * @dev Verifies that multiple apps can be registered and have sequential IDs
     */
    function testRegisterMultipleApps() public {
        vm.startPrank(deployer);

        // Register first app
        (uint256 firstAppId, uint256 firstAppVersion) = _registerTestApp();
        assertEq(firstAppId, 1, "First app ID should be 1");
        assertEq(firstAppVersion, 1, "First app version should be 1");

        // Create different data for second app
        string memory secondAppName = "Second App";
        string memory secondAppDesc = "Second App Description";

        // Use different delegatee for second app to avoid conflict
        address[] memory secondAppDelegatees = new address[](1);
        secondAppDelegatees[0] = TEST_DELEGATEE_2;

        // Register second app
        vm.expectEmit(true, true, false, false);
        emit NewAppRegistered(2, deployer);

        vm.expectEmit(true, true, true, false);
        emit NewAppVersionRegistered(2, 1, deployer);

        (uint256 secondAppId, uint256 secondAppVersion) = wrappedAppFacet.registerApp(
            secondAppName,
            secondAppDesc,
            testRedirectUris,
            secondAppDelegatees,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        // Verify second app ID and version
        assertEq(secondAppId, 2, "Second app ID should be 2");
        assertEq(secondAppVersion, 1, "Second app version should be 1");

        // Verify both apps exist with correct data
        VincentAppViewFacet.App memory app1 = wrappedAppViewFacet.getAppById(firstAppId);
        VincentAppViewFacet.App memory app2 = wrappedAppViewFacet.getAppById(secondAppId);

        assertEq(
            keccak256(abi.encodePacked(app1.name)),
            keccak256(abi.encodePacked(TEST_APP_NAME)),
            "First app name should match"
        );
        assertEq(
            keccak256(abi.encodePacked(app2.name)),
            keccak256(abi.encodePacked(secondAppName)),
            "Second app name should match"
        );

        vm.stopPrank();
    }

    /**
     * @notice Test registering an app with multiple tools and policies
     * @dev Verifies that an app can be registered with multiple tools, each with multiple policies
     */
    function testRegisterAppWithMultipleToolsAndPolicies() public {
        vm.startPrank(deployer);

        // Create app with multiple tools and policies
        string[] memory multiToolIpfsCids = new string[](2);
        multiToolIpfsCids[0] = TEST_TOOL_IPFS_CID_1;
        multiToolIpfsCids[1] = TEST_TOOL_IPFS_CID_2;

        // Each tool has 2 policies
        string[][] memory multiToolPolicies = new string[][](2);
        multiToolPolicies[0] = new string[](2);
        multiToolPolicies[0][0] = TEST_POLICY_1;
        multiToolPolicies[0][1] = TEST_POLICY_2;
        multiToolPolicies[1] = new string[](2);
        multiToolPolicies[1][0] = TEST_POLICY_1;
        multiToolPolicies[1][1] = TEST_POLICY_2;

        // Parameter names for each policy
        string[][][] memory multiToolParamNames = new string[][][](2);
        // First tool's policies
        multiToolParamNames[0] = new string[][](2);
        multiToolParamNames[0][0] = new string[](1);
        multiToolParamNames[0][0][0] = TEST_POLICY_PARAM_1;
        multiToolParamNames[0][1] = new string[](1);
        multiToolParamNames[0][1][0] = TEST_POLICY_PARAM_2;
        // Second tool's policies
        multiToolParamNames[1] = new string[][](2);
        multiToolParamNames[1][0] = new string[](1);
        multiToolParamNames[1][0][0] = TEST_POLICY_PARAM_1;
        multiToolParamNames[1][1] = new string[](1);
        multiToolParamNames[1][1][0] = TEST_POLICY_PARAM_2;

        // Parameter types for each parameter
        VincentAppStorage.ParameterType[][][] memory multiToolParamTypes = new VincentAppStorage.ParameterType[][][](2);
        // First tool's policies
        multiToolParamTypes[0] = new VincentAppStorage.ParameterType[][](2);
        multiToolParamTypes[0][0] = new VincentAppStorage.ParameterType[](1);
        multiToolParamTypes[0][0][0] = VincentAppStorage.ParameterType.STRING;
        multiToolParamTypes[0][1] = new VincentAppStorage.ParameterType[](1);
        multiToolParamTypes[0][1][0] = VincentAppStorage.ParameterType.BOOL;
        // Second tool's policies
        multiToolParamTypes[1] = new VincentAppStorage.ParameterType[][](2);
        multiToolParamTypes[1][0] = new VincentAppStorage.ParameterType[](1);
        multiToolParamTypes[1][0][0] = VincentAppStorage.ParameterType.STRING;
        multiToolParamTypes[1][1] = new VincentAppStorage.ParameterType[](1);
        multiToolParamTypes[1][1][0] = VincentAppStorage.ParameterType.UINT256;

        // Register app with multiple tools and policies
        (uint256 appId, uint256 appVersion) = wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            testRedirectUris,
            testDelegatees,
            multiToolIpfsCids,
            multiToolPolicies,
            multiToolParamNames,
            multiToolParamTypes
        );

        // Verify app ID and version
        assertEq(appId, 1, "App ID should be 1");
        assertEq(appVersion, 1, "App version should be 1");

        // Verify app version data to check tool count
        (VincentAppViewFacet.App memory app, VincentAppViewFacet.AppVersion memory versionData) =
            wrappedAppViewFacet.getAppVersion(appId, appVersion);

        // Verify tools were correctly registered
        assertEq(versionData.tools.length, 2, "App version should have 2 tools");

        // Verify each tool has 2 policies
        assertEq(versionData.tools[0].policies.length, 2, "First tool should have 2 policies");
        assertEq(versionData.tools[1].policies.length, 2, "Second tool should have 2 policies");

        vm.stopPrank();
    }

    /**
     * @notice Test registering an app with empty redirect URIs
     * @dev Verifies that app registration fails when no redirect URIs are provided
     */
    function testRegisterAppWithNoRedirectUris() public {
        vm.startPrank(deployer);

        // Create empty redirect URIs array
        string[] memory emptyRedirectUris = new string[](0);

        // Expect the call to revert with NoRedirectUrisProvided error
        vm.expectRevert(abi.encodeWithSignature("NoRedirectUrisProvided()"));

        // Call registerApp with empty redirect URIs
        wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            emptyRedirectUris,
            testDelegatees,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        vm.stopPrank();
    }

    /**
     * @notice Test registering an app with empty name
     * @dev Verifies that app registration fails when an empty name is provided
     */
    function testRegisterAppWithEmptyName() public {
        vm.startPrank(deployer);

        // Create empty app name
        string memory emptyName = "";

        // Expect the call to revert with EmptyAppNameNotAllowed error
        vm.expectRevert(abi.encodeWithSignature("EmptyAppNameNotAllowed()"));

        // Call registerApp with empty name
        wrappedAppFacet.registerApp(
            emptyName,
            TEST_APP_DESCRIPTION,
            testRedirectUris,
            testDelegatees,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        vm.stopPrank();
    }

    /**
     * @notice Test registering an app with empty description
     * @dev Verifies that app registration fails when an empty description is provided
     */
    function testRegisterAppWithEmptyDescription() public {
        vm.startPrank(deployer);

        // Create empty app description
        string memory emptyDescription = "";

        // Expect the call to revert with EmptyAppDescriptionNotAllowed error
        vm.expectRevert(abi.encodeWithSignature("EmptyAppDescriptionNotAllowed()"));

        // Call registerApp with empty description
        wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            emptyDescription,
            testRedirectUris,
            testDelegatees,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        vm.stopPrank();
    }

    /**
     * @notice Test registering an app with empty redirect URI
     * @dev Verifies that app registration fails when an empty redirect URI is provided
     */
    function testRegisterAppWithEmptyRedirectUri() public {
        vm.startPrank(deployer);

        // Create redirect URIs array with an empty URI
        string[] memory redirectUrisWithEmpty = new string[](1);
        redirectUrisWithEmpty[0] = "";

        // Expect the call to revert with EmptyRedirectUriNotAllowed error
        vm.expectRevert(abi.encodeWithSignature("EmptyRedirectUriNotAllowed()"));

        // Call registerApp with empty redirect URI
        wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            redirectUrisWithEmpty,
            testDelegatees,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        vm.stopPrank();
    }

    /**
     * @notice Test registering an app with zero address delegatee
     * @dev Verifies that app registration fails when a zero address delegatee is provided
     */
    function testRegisterAppWithZeroAddressDelegatee() public {
        vm.startPrank(deployer);

        // Create delegatees array with a zero address
        address[] memory delegateesWithZeroAddress = new address[](1);
        delegateesWithZeroAddress[0] = address(0);

        // Expect the call to revert with ZeroAddressDelegateeNotAllowed error
        vm.expectRevert(abi.encodeWithSignature("ZeroAddressDelegateeNotAllowed()"));

        // Call registerApp with zero address delegatee
        wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            testRedirectUris,
            delegateesWithZeroAddress,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        vm.stopPrank();
    }

    /**
     * @notice Test registering an app with mismatched tool and policy array lengths
     * @dev Verifies that app registration fails when array lengths don't match
     */
    function testRegisterAppWithMismatchedArrays() public {
        vm.startPrank(deployer);

        // Create mismatched arrays (more tools than policies)
        string[] memory extraTools = new string[](2);
        extraTools[0] = TEST_TOOL_IPFS_CID_1;
        extraTools[1] = TEST_TOOL_IPFS_CID_2;

        // Expect the call to revert with ToolsAndPoliciesLengthMismatch error
        vm.expectRevert(abi.encodeWithSignature("ToolsAndPoliciesLengthMismatch()"));

        // Call registerApp with mismatched arrays
        wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            testRedirectUris,
            testDelegatees,
            extraTools, // 2 tools
            testToolPolicies, // 1 policy array
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        vm.stopPrank();
    }

    /**
     * @notice Test registering an app with a delegatee already registered to another app
     * @dev Verifies that app registration fails with DelegateeAlreadyRegisteredToApp error
     */
    function testRegisterAppWithAlreadyRegisteredDelegatee() public {
        vm.startPrank(deployer);

        // First register an app with a delegatee
        (uint256 firstAppId,) = _registerTestApp();

        // Try to register a second app with the same delegatee
        vm.expectRevert(
            abi.encodeWithSignature("DelegateeAlreadyRegisteredToApp(uint256,address)", firstAppId, TEST_DELEGATEE_1)
        );

        // Create a new app using the same delegatee
        wrappedAppFacet.registerApp(
            "Second App",
            "Second app description",
            testRedirectUris,
            testDelegatees, // Contains TEST_DELEGATEE_1 which is already registered
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        vm.stopPrank();
    }

    /**
     * @notice Test registering an app with an empty tool IPFS CID
     * @dev Verifies that app registration fails with EmptyToolIpfsCidNotAllowed error
     */
    function testRegisterAppWithEmptyToolIpfsCid() public {
        vm.startPrank(deployer);

        // Create tool array with an empty IPFS CID
        string[] memory emptyToolCids = new string[](1);
        emptyToolCids[0] = "";

        // Create matching policy arrays
        string[][] memory policies = new string[][](1);
        policies[0] = new string[](1);
        policies[0][0] = TEST_POLICY_1;

        vm.expectRevert(abi.encodeWithSignature("EmptyToolIpfsCidNotAllowed(uint256,uint256)", 1, 0));

        wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            testRedirectUris,
            testDelegatees,
            emptyToolCids,
            policies,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        vm.stopPrank();
    }

    /**
     * @notice Test registering an app with an empty policy IPFS CID
     * @dev Verifies that app registration fails with EmptyPolicyIpfsCidNotAllowed error
     */
    function testRegisterAppWithEmptyPolicyIpfsCid() public {
        vm.startPrank(deployer);

        // Create policy array with an empty IPFS CID
        string[][] memory emptyPolicies = new string[][](1);
        emptyPolicies[0] = new string[](1);
        emptyPolicies[0][0] = "";

        vm.expectRevert(abi.encodeWithSignature("EmptyPolicyIpfsCidNotAllowed(uint256,uint256)", 1, 0));

        wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            testRedirectUris,
            testDelegatees,
            testToolIpfsCids,
            emptyPolicies,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        vm.stopPrank();
    }

    /**
     * @notice Test that attempting to register an app with duplicate redirect URIs fails
     * @dev Verifies that registration fails with RedirectUriAlreadyAuthorizedForApp error
     */
    function testRegisterAppWithDuplicateRedirectURIs() public {
        vm.startPrank(deployer);

        // Create redirect URIs array with duplicates
        string[] memory duplicateRedirectUris = new string[](2);
        duplicateRedirectUris[0] = TEST_REDIRECT_URI_1;
        duplicateRedirectUris[1] = TEST_REDIRECT_URI_1; // Same as first one

        // Expect the call to revert with RedirectUriAlreadyAuthorizedForApp error
        // The first URI will be added, but when trying to add the duplicate,
        // it should revert with this error
        vm.expectRevert(
            abi.encodeWithSignature("RedirectUriAlreadyAuthorizedForApp(uint256,string)", 1, TEST_REDIRECT_URI_1)
        );

        // Attempt to register app with duplicate URIs - this should fail
        wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            duplicateRedirectUris,
            testDelegatees,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        vm.stopPrank();
    }

    /**
     * @notice Test registering an app with multiple redirect URIs
     * @dev Verifies that all unique redirect URIs are properly stored
     */
    function testRegisterAppWithMultipleRedirectURIs() public {
        vm.startPrank(deployer);

        // Create redirect URIs array with multiple URIs
        string[] memory multipleRedirectUris = new string[](2);
        multipleRedirectUris[0] = TEST_REDIRECT_URI_1;
        multipleRedirectUris[1] = TEST_REDIRECT_URI_2; // Different URI

        // Register app with multiple redirect URIs
        (uint256 appId, uint256 versionNumber) = wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            multipleRedirectUris,
            testDelegatees,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        // Verify both redirect URIs were stored
        string[] memory appRedirectUris = wrappedAppViewFacet.getAuthorizedRedirectUrisByAppId(appId);
        assertEq(appRedirectUris.length, 2, "Should have stored 2 redirect URIs");

        // Sort order is not guaranteed, so check that both URIs exist
        bool foundURI1 = false;
        bool foundURI2 = false;

        for (uint256 i = 0; i < appRedirectUris.length; i++) {
            bytes32 uriHash = keccak256(abi.encodePacked(appRedirectUris[i]));
            if (uriHash == keccak256(abi.encodePacked(TEST_REDIRECT_URI_1))) {
                foundURI1 = true;
            } else if (uriHash == keccak256(abi.encodePacked(TEST_REDIRECT_URI_2))) {
                foundURI2 = true;
            }
        }

        assertTrue(foundURI1, "Should have found first redirect URI");
        assertTrue(foundURI2, "Should have found second redirect URI");

        vm.stopPrank();
    }

    /**
     * @notice Test registering a new version of an existing app
     * @dev Verifies that a new app version can be registered with updated tools/policies
     */
    function testRegisterNextAppVersion() public {
        vm.startPrank(deployer);

        // First register an app
        (uint256 appId, uint256 firstVersionNumber) = _registerTestApp();

        // Create updated data for the second version
        string[] memory updatedToolIpfsCids = new string[](1);
        updatedToolIpfsCids[0] = TEST_TOOL_IPFS_CID_2; // Use a different tool

        // Prepare matching policy arrays for the new tool
        string[][] memory updatedPolicies = new string[][](1);
        updatedPolicies[0] = new string[](1);
        updatedPolicies[0][0] = TEST_POLICY_2;

        string[][][] memory updatedParameterNames = new string[][][](1);
        updatedParameterNames[0] = new string[][](1);
        updatedParameterNames[0][0] = new string[](1);
        updatedParameterNames[0][0][0] = TEST_POLICY_PARAM_2;

        VincentAppStorage.ParameterType[][][] memory updatedParameterTypes =
            new VincentAppStorage.ParameterType[][][](1);
        updatedParameterTypes[0] = new VincentAppStorage.ParameterType[][](1);
        updatedParameterTypes[0][0] = new VincentAppStorage.ParameterType[](1);
        updatedParameterTypes[0][0][0] = VincentAppStorage.ParameterType.BOOL;

        // Expect the NewAppVersionRegistered event
        vm.expectEmit(true, true, true, false);
        emit NewAppVersionRegistered(appId, 2, deployer);

        // Register a new version of the app
        uint256 newVersionNumber = wrappedAppFacet.registerNextAppVersion(
            appId, updatedToolIpfsCids, updatedPolicies, updatedParameterNames, updatedParameterTypes
        );

        // Verify new version number
        assertEq(newVersionNumber, 2, "New version number should be 2");

        // Verify app version is created and enabled
        (VincentAppViewFacet.App memory app, VincentAppViewFacet.AppVersion memory versionData) =
            wrappedAppViewFacet.getAppVersion(appId, newVersionNumber);
        assertTrue(versionData.enabled, "New app version should be enabled");

        // Verify tools were correctly registered in the new version
        assertEq(versionData.tools.length, 1, "App version should have 1 tool");
        assertEq(
            keccak256(abi.encodePacked(versionData.tools[0].toolIpfsCid)),
            keccak256(abi.encodePacked(TEST_TOOL_IPFS_CID_2)),
            "Tool IPFS CID should match"
        );

        // Verify policies were correctly registered for the new tool
        assertEq(versionData.tools[0].policies.length, 1, "Tool should have 1 policy");
        assertEq(
            keccak256(abi.encodePacked(versionData.tools[0].policies[0].policyIpfsCid)),
            keccak256(abi.encodePacked(TEST_POLICY_2)),
            "Policy IPFS CID should match"
        );

        vm.stopPrank();
    }

    /**
     * @notice Test registering a new app version with multiple tools
     * @dev Verifies that a complex app version with multiple tools and policies can be registered
     */
    function testRegisterNextAppVersionWithMultipleTools() public {
        vm.startPrank(deployer);

        // First register an app
        (uint256 appId, uint256 firstVersionNumber) = _registerTestApp();

        // Create data for a more complex second version with multiple tools
        string[] memory multiToolIpfsCids = new string[](2);
        multiToolIpfsCids[0] = TEST_TOOL_IPFS_CID_1; // Reuse the first tool
        multiToolIpfsCids[1] = TEST_TOOL_IPFS_CID_2; // Add a second tool

        // Each tool has 2 policies
        string[][] memory multiToolPolicies = new string[][](2);
        multiToolPolicies[0] = new string[](2);
        multiToolPolicies[0][0] = TEST_POLICY_1;
        multiToolPolicies[0][1] = TEST_POLICY_2;
        multiToolPolicies[1] = new string[](2);
        multiToolPolicies[1][0] = TEST_POLICY_1;
        multiToolPolicies[1][1] = TEST_POLICY_2;

        // Parameter names for each policy
        string[][][] memory multiToolParamNames = new string[][][](2);
        // First tool's policies
        multiToolParamNames[0] = new string[][](2);
        multiToolParamNames[0][0] = new string[](1);
        multiToolParamNames[0][0][0] = TEST_POLICY_PARAM_1;
        multiToolParamNames[0][1] = new string[](1);
        multiToolParamNames[0][1][0] = TEST_POLICY_PARAM_2;
        // Second tool's policies
        multiToolParamNames[1] = new string[][](2);
        multiToolParamNames[1][0] = new string[](1);
        multiToolParamNames[1][0][0] = TEST_POLICY_PARAM_1;
        multiToolParamNames[1][1] = new string[](1);
        multiToolParamNames[1][1][0] = TEST_POLICY_PARAM_2;

        // Parameter types for each parameter
        VincentAppStorage.ParameterType[][][] memory multiToolParamTypes = new VincentAppStorage.ParameterType[][][](2);
        // First tool's policies
        multiToolParamTypes[0] = new VincentAppStorage.ParameterType[][](2);
        multiToolParamTypes[0][0] = new VincentAppStorage.ParameterType[](1);
        multiToolParamTypes[0][0][0] = VincentAppStorage.ParameterType.STRING;
        multiToolParamTypes[0][1] = new VincentAppStorage.ParameterType[](1);
        multiToolParamTypes[0][1][0] = VincentAppStorage.ParameterType.BOOL;
        // Second tool's policies
        multiToolParamTypes[1] = new VincentAppStorage.ParameterType[][](2);
        multiToolParamTypes[1][0] = new VincentAppStorage.ParameterType[](1);
        multiToolParamTypes[1][0][0] = VincentAppStorage.ParameterType.STRING;
        multiToolParamTypes[1][1] = new VincentAppStorage.ParameterType[](1);
        multiToolParamTypes[1][1][0] = VincentAppStorage.ParameterType.UINT256;

        // Register a new version of the app with multiple tools
        uint256 newVersionNumber = wrappedAppFacet.registerNextAppVersion(
            appId, multiToolIpfsCids, multiToolPolicies, multiToolParamNames, multiToolParamTypes
        );

        // Verify new version number
        assertEq(newVersionNumber, 2, "New version number should be 2");

        // Verify app version data to check tool count
        (VincentAppViewFacet.App memory app, VincentAppViewFacet.AppVersion memory versionData) =
            wrappedAppViewFacet.getAppVersion(appId, newVersionNumber);

        // Verify tools were correctly registered
        assertEq(versionData.tools.length, 2, "App version should have 2 tools");

        // Verify each tool has 2 policies
        assertEq(versionData.tools[0].policies.length, 2, "First tool should have 2 policies");
        assertEq(versionData.tools[1].policies.length, 2, "Second tool should have 2 policies");

        vm.stopPrank();
    }

    /**
     * @notice Test that only the app manager can register a new app version
     * @dev Verifies the onlyAppManager modifier works correctly
     */
    function testRegisterNextAppVersionNotAppManager() public {
        vm.startPrank(deployer);

        // First register an app
        (uint256 appId, uint256 firstVersionNumber) = _registerTestApp();

        vm.stopPrank();

        // Switch to a different address (not the app manager)
        vm.startPrank(address(0xBEEF));

        // Expect the call to revert with NotAppManager error
        vm.expectRevert(abi.encodeWithSignature("NotAppManager(uint256,address)", appId, address(0xBEEF)));

        // Try to register a new version of the app as non-manager
        wrappedAppFacet.registerNextAppVersion(
            appId, testToolIpfsCids, testToolPolicies, testToolPolicyParameterNames, testToolPolicyParameterTypes
        );

        vm.stopPrank();
    }

    /**
     * @notice Test registering a new app version with mismatched tool and policy array lengths
     * @dev Verifies that version registration fails when array lengths don't match
     */
    function testRegisterNextAppVersionWithMismatchedArrays() public {
        vm.startPrank(deployer);

        // First register an app
        (uint256 appId, uint256 firstVersionNumber) = _registerTestApp();

        // Create mismatched arrays (more tools than policies)
        string[] memory extraTools = new string[](2);
        extraTools[0] = TEST_TOOL_IPFS_CID_1;
        extraTools[1] = TEST_TOOL_IPFS_CID_2;

        // Expect the call to revert with ToolsAndPoliciesLengthMismatch error
        vm.expectRevert(abi.encodeWithSignature("ToolsAndPoliciesLengthMismatch()"));

        // Try to register a new app version with mismatched arrays
        wrappedAppFacet.registerNextAppVersion(
            appId,
            extraTools, // 2 tools
            testToolPolicies, // 1 policy array
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        vm.stopPrank();
    }

    /**
     * @notice Test registering a new app version with an empty tool IPFS CID
     * @dev Verifies that registration fails with EmptyToolIpfsCidNotAllowed error
     */
    function testRegisterNextAppVersionWithEmptyToolIpfsCid() public {
        vm.startPrank(deployer);

        // First register an app
        (uint256 appId, uint256 firstVersionNumber) = _registerTestApp();

        // Create tool array with an empty IPFS CID
        string[] memory emptyToolCids = new string[](1);
        emptyToolCids[0] = "";

        // Create matching policy arrays
        string[][] memory policies = new string[][](1);
        policies[0] = new string[](1);
        policies[0][0] = TEST_POLICY_1;

        vm.expectRevert(abi.encodeWithSignature("EmptyToolIpfsCidNotAllowed(uint256,uint256)", appId, 0));

        // Try to register a new app version with an empty tool IPFS CID
        wrappedAppFacet.registerNextAppVersion(
            appId, emptyToolCids, policies, testToolPolicyParameterNames, testToolPolicyParameterTypes
        );

        vm.stopPrank();
    }

    /**
     * @notice Test registering a new app version with an empty policy IPFS CID
     * @dev Verifies that registration fails with EmptyPolicyIpfsCidNotAllowed error
     */
    function testRegisterNextAppVersionWithEmptyPolicyIpfsCid() public {
        vm.startPrank(deployer);

        // First register an app
        (uint256 appId, uint256 firstVersionNumber) = _registerTestApp();

        // Create policy array with an empty IPFS CID
        string[][] memory emptyPolicies = new string[][](1);
        emptyPolicies[0] = new string[](1);
        emptyPolicies[0][0] = "";

        vm.expectRevert(abi.encodeWithSignature("EmptyPolicyIpfsCidNotAllowed(uint256,uint256)", appId, 0));

        // Try to register a new app version with an empty policy IPFS CID
        wrappedAppFacet.registerNextAppVersion(
            appId, testToolIpfsCids, emptyPolicies, testToolPolicyParameterNames, testToolPolicyParameterTypes
        );

        vm.stopPrank();
    }

    /**
     * @notice Test registering multiple versions of the same app sequentially
     * @dev Verifies that version numbers increment correctly
     */
    function testRegisterMultipleAppVersionsSequentially() public {
        vm.startPrank(deployer);

        // First register an app
        (uint256 appId, uint256 firstVersionNumber) = _registerTestApp();
        assertEq(firstVersionNumber, 1, "First version number should be 1");

        // Create different tools for each version
        string[] memory secondVersionTool = new string[](1);
        secondVersionTool[0] = TEST_TOOL_IPFS_CID_2;

        // Register second version
        uint256 secondVersionNumber = wrappedAppFacet.registerNextAppVersion(
            appId, secondVersionTool, testToolPolicies, testToolPolicyParameterNames, testToolPolicyParameterTypes
        );

        assertEq(secondVersionNumber, 2, "Second version number should be 2");

        // Create a third version with a different tool
        string[] memory thirdVersionTool = new string[](1);
        thirdVersionTool[0] = "QmThirdToolIpfsCid";

        // Register third version
        uint256 thirdVersionNumber = wrappedAppFacet.registerNextAppVersion(
            appId, thirdVersionTool, testToolPolicies, testToolPolicyParameterNames, testToolPolicyParameterTypes
        );

        assertEq(thirdVersionNumber, 3, "Third version number should be 3");

        // Verify all versions exist and are enabled
        (VincentAppViewFacet.App memory appV1, VincentAppViewFacet.AppVersion memory versionDataV1) =
            wrappedAppViewFacet.getAppVersion(appId, 1);
        assertTrue(versionDataV1.enabled, "First version should be enabled");

        (VincentAppViewFacet.App memory appV2, VincentAppViewFacet.AppVersion memory versionDataV2) =
            wrappedAppViewFacet.getAppVersion(appId, 2);
        assertTrue(versionDataV2.enabled, "Second version should be enabled");

        (VincentAppViewFacet.App memory appV3, VincentAppViewFacet.AppVersion memory versionDataV3) =
            wrappedAppViewFacet.getAppVersion(appId, 3);
        assertTrue(versionDataV3.enabled, "Third version should be enabled");

        vm.stopPrank();
    }

    /**
     * @notice Test registering an app with an empty tools array
     * @dev Verifies that app registration fails with NoToolsProvided error
     */
    function testRegisterAppWithEmptyToolsArray() public {
        vm.startPrank(deployer);

        // Create empty tools array
        string[] memory emptyToolsArray = new string[](0);

        // Create matching empty arrays for policies and parameters
        string[][] memory emptyPolicies = new string[][](0);
        string[][][] memory emptyParameterNames = new string[][][](0);
        VincentAppStorage.ParameterType[][][] memory emptyParameterTypes = new VincentAppStorage.ParameterType[][][](0);

        // Expect the call to revert with NoToolsProvided error
        vm.expectRevert(abi.encodeWithSignature("NoToolsProvided(uint256)", 1));

        // Call registerApp with empty tools array
        wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            testRedirectUris,
            testDelegatees,
            emptyToolsArray,
            emptyPolicies,
            emptyParameterNames,
            emptyParameterTypes
        );

        vm.stopPrank();
    }

    /**
     * @notice Test registering a new app version with an empty tools array
     * @dev Verifies that version registration fails with NoToolsProvided error
     */
    function testRegisterNextAppVersionWithEmptyToolsArray() public {
        vm.startPrank(deployer);

        // First register an app with valid tools
        (uint256 appId, uint256 firstVersionNumber) = _registerTestApp();

        // Create empty tools array for the next version
        string[] memory emptyToolsArray = new string[](0);

        // Create matching empty arrays for policies and parameters
        string[][] memory emptyPolicies = new string[][](0);
        string[][][] memory emptyParameterNames = new string[][][](0);
        VincentAppStorage.ParameterType[][][] memory emptyParameterTypes = new VincentAppStorage.ParameterType[][][](0);

        // Expect the call to revert with NoToolsProvided error
        vm.expectRevert(abi.encodeWithSignature("NoToolsProvided(uint256)", appId));

        // Try to register a new app version with empty tools array
        wrappedAppFacet.registerNextAppVersion(
            appId, emptyToolsArray, emptyPolicies, emptyParameterNames, emptyParameterTypes
        );

        vm.stopPrank();
    }

    /**
     * @notice Test registering an app with a tool that has no policies
     * @dev Verifies that tools can be registered without policies
     */
    function testRegisterAppWithToolWithoutPolicies() public {
        vm.startPrank(deployer);

        // Create tools array with one tool
        string[] memory toolsArray = new string[](1);
        toolsArray[0] = TEST_TOOL_IPFS_CID_1;

        // Create empty policies array for the tool
        string[][] memory emptyPoliciesForTool = new string[][](1);
        emptyPoliciesForTool[0] = new string[](0); // Empty policies for the tool

        string[][][] memory parameterNames = new string[][][](1);
        parameterNames[0] = new string[][](0);

        VincentAppStorage.ParameterType[][][] memory parameterTypes = new VincentAppStorage.ParameterType[][][](1);
        parameterTypes[0] = new VincentAppStorage.ParameterType[][](0);

        // Register app with a tool that has no policies
        // This should not revert
        (uint256 appId, uint256 versionId) = wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            testRedirectUris,
            testDelegatees,
            toolsArray,
            emptyPoliciesForTool,
            parameterNames,
            parameterTypes
        );

        // Verify app was registered
        VincentAppViewFacet.App memory app = wrappedAppViewFacet.getAppById(appId);
        assertEq(
            keccak256(abi.encodePacked(app.name)), keccak256(abi.encodePacked(TEST_APP_NAME)), "App name should match"
        );

        // Verify app version was registered
        (VincentAppViewFacet.App memory appData, VincentAppViewFacet.AppVersion memory versionData) =
            wrappedAppViewFacet.getAppVersion(appId, versionId);
        assertTrue(versionData.enabled, "App version should be enabled");

        // Verify the tool was registered
        assertEq(versionData.tools.length, 1, "Should have 1 tool");
        // And the tool has no policies
        assertEq(versionData.tools[0].policies.length, 0, "Tool should have 0 policies");

        vm.stopPrank();
    }

    /**
     * @notice Test registering a new app version with a tool that has no policies
     * @dev Verifies that a new version can be registered with tools that have no policies
     */
    function testRegisterNextAppVersionWithToolWithoutPolicies() public {
        vm.startPrank(deployer);

        // First register an app with valid tools
        (uint256 appId, uint256 firstVersionNumber) = _registerTestApp();

        // Create tools array with one tool
        string[] memory toolsArray = new string[](1);
        toolsArray[0] = TEST_TOOL_IPFS_CID_2; // Use a different tool

        // Create empty policies array for the tool
        string[][] memory emptyPoliciesForTool = new string[][](1);
        emptyPoliciesForTool[0] = new string[](0); // Empty policies for the tool

        string[][][] memory parameterNames = new string[][][](1);
        parameterNames[0] = new string[][](0);

        VincentAppStorage.ParameterType[][][] memory parameterTypes = new VincentAppStorage.ParameterType[][][](1);
        parameterTypes[0] = new VincentAppStorage.ParameterType[][](0);

        // Register a new app version with a tool that has no policies
        // This should not revert
        uint256 newVersionId = wrappedAppFacet.registerNextAppVersion(
            appId, toolsArray, emptyPoliciesForTool, parameterNames, parameterTypes
        );

        // Verify the new version was registered
        (VincentAppViewFacet.App memory appData, VincentAppViewFacet.AppVersion memory versionData) =
            wrappedAppViewFacet.getAppVersion(appId, newVersionId);
        assertTrue(versionData.enabled, "New app version should be enabled");

        // Verify the tool was registered
        assertEq(versionData.tools.length, 1, "Should have 1 tool");
        // And the tool has no policies
        assertEq(versionData.tools[0].policies.length, 0, "Tool should have 0 policies");

        vm.stopPrank();
    }

    /**
     * @notice Test registering an app with an empty parameter name
     * @dev Verifies that app registration fails with EmptyParameterNameNotAllowed error when a tool has policies with parameters
     */
    function testRegisterAppWithEmptyParameterName() public {
        vm.startPrank(deployer);

        // Create tools array with one tool
        string[] memory toolsArray = new string[](1);
        toolsArray[0] = TEST_TOOL_IPFS_CID_1;

        // Create policies array for the tool
        string[][] memory policies = new string[][](1);
        policies[0] = new string[](1);
        policies[0][0] = TEST_POLICY_1;

        // Create parameter names array with an empty parameter name
        string[][][] memory parameterNames = new string[][][](1);
        parameterNames[0] = new string[][](1);
        parameterNames[0][0] = new string[](1);
        parameterNames[0][0][0] = ""; // Empty parameter name

        VincentAppStorage.ParameterType[][][] memory parameterTypes = new VincentAppStorage.ParameterType[][][](1);
        parameterTypes[0] = new VincentAppStorage.ParameterType[][](1);
        parameterTypes[0][0] = new VincentAppStorage.ParameterType[](1);
        parameterTypes[0][0][0] = VincentAppStorage.ParameterType.STRING;

        // Expect the call to revert with EmptyParameterNameNotAllowed error
        vm.expectRevert(
            abi.encodeWithSignature("EmptyParameterNameNotAllowed(uint256,uint256,uint256,uint256)", 1, 0, 0, 0)
        );

        // Call registerApp with an empty parameter name
        wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            testRedirectUris,
            testDelegatees,
            toolsArray,
            policies,
            parameterNames,
            parameterTypes
        );

        vm.stopPrank();
    }
}
