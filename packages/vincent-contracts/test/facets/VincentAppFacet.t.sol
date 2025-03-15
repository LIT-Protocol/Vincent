// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

import "../helpers/VincentTestHelper.sol";
import "../../src/facets/VincentAppFacet.sol";
import "../../src/facets/VincentToolFacet.sol";

/**
 * @title VincentAppFacetTest
 * @dev Tests for the VincentAppFacet and VincentAppViewFacet contracts
 */
contract VincentAppFacetTest is VincentTestHelper {
    // Test variables
    uint256 public appId;
    uint256 public appVersion;

    function setUp() public override {
        // Call parent setup
        super.setUp();

        // Set up the test as the deployer
        vm.startPrank(deployer);
    }

    function testRegisterApp() public {
        // Create test redirectUris, and delegatees
        string[] memory redirectUris = new string[](2);
        redirectUris[0] = TEST_REDIRECT_URI_1;
        redirectUris[1] = TEST_REDIRECT_URI_2;

        address[] memory delegatees = new address[](2);
        delegatees[0] = TEST_DELEGATEE_1;
        delegatees[1] = TEST_DELEGATEE_2;

        // Set up empty tool arrays
        string[] memory toolIpfsCids = new string[](0);
        string[][] memory toolPolicies = new string[][](0);
        string[][][] memory toolPolicyParameterNames = new string[][][](0);

        // The appId will be 1 as it's the first app registered (changing from 0 to 1)
        vm.expectEmit(true, true, false, false);
        emit NewAppRegistered(1, deployer);

        // Register the app
        (appId, appVersion) = wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            redirectUris,
            delegatees,
            toolIpfsCids,
            toolPolicies,
            toolPolicyParameterNames
        );

        // Verify app was registered correctly
        VincentAppViewFacet.App memory app = wrappedAppViewFacet.getAppById(appId);

        // Verify basic app data
        assertEq(app.name, TEST_APP_NAME, "App name doesn't match");
        assertEq(app.description, TEST_APP_DESCRIPTION, "App description doesn't match");
        assertEq(app.manager, deployer, "App manager doesn't match");
        assertEq(app.latestVersion, 1, "App latest version should be 1 since we always create a version");

        // Verify authorized redirect URIs
        assertEq(app.authorizedRedirectUris.length, 2, "Should have 2 authorized redirect URIs");
        assertEq(app.authorizedRedirectUris[0], TEST_REDIRECT_URI_1, "First redirect URI doesn't match");
        assertEq(app.authorizedRedirectUris[1], TEST_REDIRECT_URI_2, "Second redirect URI doesn't match");

        // Verify delegatees
        assertEq(app.delegatees.length, 2, "Should have 2 delegatees");
        assertEq(app.delegatees[0], TEST_DELEGATEE_1, "First delegatee doesn't match");
        assertEq(app.delegatees[1], TEST_DELEGATEE_2, "Second delegatee doesn't match");
    }

    function testRegisterAppWithVersion() public {
        // Removed the domains array initialization
        string[] memory redirectUris = new string[](1);
        redirectUris[0] = TEST_REDIRECT_URI_1;

        address[] memory delegatees = new address[](1);
        delegatees[0] = TEST_DELEGATEE_1;

        string[] memory toolIpfsCids = new string[](1);
        toolIpfsCids[0] = TEST_TOOL_IPFS_CID_1;

        string[][] memory toolPolicies = new string[][](1);
        toolPolicies[0] = new string[](1);
        toolPolicies[0][0] = TEST_POLICY_1;

        string[][][] memory toolPolicyParameterNames = new string[][][](1);
        toolPolicyParameterNames[0] = new string[][](1);
        toolPolicyParameterNames[0][0] = new string[](1);
        toolPolicyParameterNames[0][0][0] = TEST_POLICY_PARAM_1;

        // Register the tool first so it's available for the app version
        wrappedToolFacet.registerTool(TEST_TOOL_IPFS_CID_1);

        // The appId will be 1 as it's the first app registered
        vm.expectEmit(true, true, false, false);
        emit NewAppRegistered(1, deployer);

        vm.expectEmit(true, true, true, false);
        emit NewAppVersionRegistered(1, 1, deployer);

        // Register the app with a version - removed domains parameter
        (appId, appVersion) = wrappedAppFacet.registerApp(
            "Test App",
            "Test App Description",
            redirectUris,
            delegatees,
            toolIpfsCids,
            toolPolicies,
            toolPolicyParameterNames
        );

        // Verify app was registered correctly
        VincentAppViewFacet.App memory app = wrappedAppViewFacet.getAppById(appId);

        // Verify basic app data
        assertEq(app.name, TEST_APP_NAME, "App name doesn't match");
        assertEq(app.description, TEST_APP_DESCRIPTION, "App description doesn't match");
        assertEq(app.manager, deployer, "App manager doesn't match");
        assertEq(app.latestVersion, 1, "App latest version should be 1");

        // Removed authorizedDomains verification since domains are no longer tracked

        // Verify authorized redirect URIs
        assertEq(app.authorizedRedirectUris.length, 1, "Should have 1 authorized redirect URI");
        assertEq(app.authorizedRedirectUris[0], TEST_REDIRECT_URI_1, "Redirect URI doesn't match");

        // Verify delegatees
        assertEq(app.delegatees.length, 1, "Should have 1 delegatee");
        assertEq(app.delegatees[0], TEST_DELEGATEE_1, "Delegatee doesn't match");

        // Verify versioned app data
        (VincentAppViewFacet.App memory appData, VincentAppViewFacet.AppVersion memory version) =
            wrappedAppViewFacet.getAppVersion(appId, appVersion);

        assertEq(version.version, 1, "App version should be 1");
        assertEq(version.enabled, true, "App version should be enabled by default");

        // Verify tools
        assertEq(version.toolIpfsCidHashes.length, 1, "Should have 1 tool registered");
        assertEq(version.toolIpfsCidHashes[0], TEST_TOOL_IPFS_CID_1, "Tool IPFS CID doesn't match");
    }

    function testRegisterNextAppVersion() public {
        // First register an app
        (appId,) = _registerTestApp();

        // Set up data for the next version
        string[] memory toolIpfsCids = new string[](1);
        toolIpfsCids[0] = TEST_TOOL_IPFS_CID_2;

        // Set up tool policies
        string[][] memory toolPolicies = new string[][](1);
        toolPolicies[0] = new string[](0);

        string[][][] memory toolPolicyParameterNames = new string[][][](1);
        toolPolicyParameterNames[0] = new string[][](0);

        // Register the tool first
        wrappedToolFacet.registerTool(TEST_TOOL_IPFS_CID_2);

        // Set up event expectations
        vm.expectEmit(true, true, true, false);
        emit NewAppVersionRegistered(appId, 2, deployer);

        // Register the next app version
        uint256 newVersion =
            wrappedAppFacet.registerNextAppVersion(appId, toolIpfsCids, toolPolicies, toolPolicyParameterNames);

        // Verify the new version was registered correctly
        assertEq(newVersion, 2, "New version should be 2");

        // Get the app to check its latest version
        VincentAppViewFacet.App memory app = wrappedAppViewFacet.getAppById(appId);
        assertEq(app.latestVersion, 2, "Latest version should be 2");

        // Verify versioned app data
        (VincentAppViewFacet.App memory appData, VincentAppViewFacet.AppVersion memory versionData) =
            wrappedAppViewFacet.getAppVersion(appId, newVersion);

        assertEq(versionData.version, 2, "App version should be 2");
        assertEq(versionData.enabled, true, "App version should be enabled by default");

        // Verify tools - we can check the tools directly from the versioned app view
        assertEq(versionData.toolIpfsCidHashes.length, 1, "Should have 1 tool registered");
        assertEq(versionData.toolIpfsCidHashes[0], TEST_TOOL_IPFS_CID_2, "Tool IPFS CID doesn't match");
    }

    function testEnableAppVersion() public {
        // First register an app with a version
        (appId, appVersion) = _registerTestApp();

        // Set up event expectations
        vm.expectEmit(true, true, true, false);
        emit AppEnabled(appId, appVersion, false);

        // Disable the app version
        wrappedAppFacet.enableAppVersion(appId, appVersion, false);

        // Verify the app version is disabled by checking the versioned app view
        (VincentAppViewFacet.App memory versionApp, VincentAppViewFacet.AppVersion memory version) =
            wrappedAppViewFacet.getAppVersion(appId, appVersion);
        assertFalse(version.enabled, "App version should be disabled");

        // Re-enable the app version
        vm.expectEmit(true, true, true, false);
        emit AppEnabled(appId, appVersion, true);

        wrappedAppFacet.enableAppVersion(appId, appVersion, true);

        // Verify the app version is enabled again
        (, version) = wrappedAppViewFacet.getAppVersion(appId, appVersion);
        assertTrue(version.enabled, "App version should be enabled");

        // Get apps by manager
        VincentAppViewFacet.AppWithVersions[] memory appsWithVersions = wrappedAppViewFacet.getAppsByManager(deployer);

        // Verify we got one app (there's only one registered)
        assertEq(appsWithVersions.length, 1, "Should return 1 app for the manager");

        // Check first app
        assertEq(appsWithVersions[0].app.name, TEST_APP_NAME, "App name should match");
        assertEq(appsWithVersions[0].app.latestVersion, 1, "App should have 1 version");
        assertEq(appsWithVersions[0].versions.length, 1, "App should have 1 version in the versions array");
        assertEq(appsWithVersions[0].versions[0].version, 1, "App version should be 1");
        assertEq(appsWithVersions[0].versions[0].enabled, true, "App version should be enabled");

        // Register a non-manager account
        vm.stopPrank();
        vm.startPrank(nonOwner);

        // Non-manager should have no apps
        VincentAppViewFacet.AppWithVersions[] memory nonManagerApps = wrappedAppViewFacet.getAppsByManager(nonOwner);
        assertEq(nonManagerApps.length, 0, "Non-manager should have 0 apps");
    }

    function testAddAndRemoveAuthorizedRedirectUri() public {
        // First register an app
        (appId, appVersion) = _registerTestApp();

        // Set up event expectations for adding redirect URI
        vm.expectEmit(true, true, false, false);
        emit AuthorizedRedirectUriAdded(appId, TEST_REDIRECT_URI_2);

        // Add an authorized redirect URI
        wrappedAppFacet.addAuthorizedRedirectUri(appId, TEST_REDIRECT_URI_2);

        // Verify the redirect URI was added by checking the app's redirect URIs
        VincentAppViewFacet.App memory app = wrappedAppViewFacet.getAppById(appId);
        assertEq(app.authorizedRedirectUris.length, 2, "Should have 2 authorized redirect URIs");

        // Check if both redirect URIs are present (order may vary)
        bool foundUri1 = false;
        bool foundUri2 = false;
        for (uint256 i = 0; i < app.authorizedRedirectUris.length; i++) {
            if (
                keccak256(abi.encodePacked(app.authorizedRedirectUris[i]))
                    == keccak256(abi.encodePacked(TEST_REDIRECT_URI_1))
            ) {
                foundUri1 = true;
            } else if (
                keccak256(abi.encodePacked(app.authorizedRedirectUris[i]))
                    == keccak256(abi.encodePacked(TEST_REDIRECT_URI_2))
            ) {
                foundUri2 = true;
            }
        }
        assertTrue(foundUri1, "Redirect URI 1 should be in the list");
        assertTrue(foundUri2, "Redirect URI 2 should be in the list");

        // Set up event expectations for removing redirect URI
        vm.expectEmit(true, true, false, false);
        emit AuthorizedRedirectUriRemoved(appId, TEST_REDIRECT_URI_2);

        // Remove the authorized redirect URI
        wrappedAppFacet.removeAuthorizedRedirectUri(appId, TEST_REDIRECT_URI_2);

        // Verify the redirect URI was removed
        app = wrappedAppViewFacet.getAppById(appId);
        assertEq(app.authorizedRedirectUris.length, 1, "Should have 1 authorized redirect URI");
        assertEq(
            app.authorizedRedirectUris[0], TEST_REDIRECT_URI_1, "Remaining redirect URI should be TEST_REDIRECT_URI_1"
        );
    }

    function testAddAndRemoveDelegatee() public {
        // First register an app
        (appId, appVersion) = _registerTestApp();

        // Add a new delegatee
        wrappedAppFacet.addDelegatee(appId, TEST_DELEGATEE_2);

        // Verify the delegatee was added by checking the app's delegatees
        VincentAppViewFacet.App memory app = wrappedAppViewFacet.getAppById(appId);
        assertEq(app.delegatees.length, 2, "Should have 2 delegatees");

        // Check if both delegatees are present (order may vary)
        bool foundDelegatee1 = false;
        bool foundDelegatee2 = false;
        for (uint256 i = 0; i < app.delegatees.length; i++) {
            if (app.delegatees[i] == TEST_DELEGATEE_1) {
                foundDelegatee1 = true;
            } else if (app.delegatees[i] == TEST_DELEGATEE_2) {
                foundDelegatee2 = true;
            }
        }
        assertTrue(foundDelegatee1, "Delegatee 1 should be in the list");
        assertTrue(foundDelegatee2, "Delegatee 2 should be in the list");

        // Get app by delegatee to verify it's properly linked
        VincentAppViewFacet.App memory appByDelegatee = wrappedAppViewFacet.getAppByDelegatee(TEST_DELEGATEE_2);
        assertEq(appByDelegatee.name, TEST_APP_NAME, "App name doesn't match when retrieved by delegatee");

        // Remove a delegatee
        wrappedAppFacet.removeDelegatee(appId, TEST_DELEGATEE_2);

        // Verify the delegatee was removed
        app = wrappedAppViewFacet.getAppById(appId);
        assertEq(app.delegatees.length, 1, "Should have 1 delegatee");
        assertEq(app.delegatees[0], TEST_DELEGATEE_1, "Remaining delegatee should be TEST_DELEGATEE_1");

        // Get app by delegatee after removal - should return empty app
        appByDelegatee = wrappedAppViewFacet.getAppByDelegatee(TEST_DELEGATEE_2);
        assertEq(appByDelegatee.name, "", "App name should be empty for removed delegatee");
    }

    function testGetVersionToolsAndPolicies() public {
        // First register an app with a version and tools/policies
        (appId, appVersion) = _registerTestApp();

        // Get tools directly from the versioned app view
        (VincentAppViewFacet.App memory unused, VincentAppViewFacet.AppVersion memory versionData) =
            wrappedAppViewFacet.getAppVersion(appId, appVersion);

        // Verify we got the right tools
        assertEq(versionData.toolIpfsCidHashes.length, 1, "Should have 1 tool");
        assertEq(versionData.toolIpfsCidHashes[0], TEST_TOOL_IPFS_CID_1, "Tool IPFS CID doesn't match");
    }

    function testFailEnableAppVersionAsNonManager() public {
        // First register an app with a version
        (appId, appVersion) = _registerTestApp();

        // Try to enable app version as non-manager (should revert)
        vm.stopPrank();
        vm.prank(nonOwner);

        // This should revert with NotAppManager error
        wrappedAppFacet.enableAppVersion(appId, appVersion, false);
    }

    function testFailAddDuplicateDelegatee() public {
        // First register an app
        (appId, appVersion) = _registerTestApp();

        // Register a second app
        // Removed domains array
        string[] memory redirectUris = new string[](1);
        redirectUris[0] = TEST_REDIRECT_URI_2;

        address[] memory delegatees = new address[](1);
        delegatees[0] = TEST_DELEGATEE_1; // Already registered to the first app

        // Set up empty tool arrays
        string[] memory emptyTools = new string[](0);
        string[][] memory emptyPolicies = new string[][](0);
        string[][][] memory emptyPolicyParams = new string[][][](0);

        // This should revert with DelegateeAlreadyRegisteredToApp error
        wrappedAppFacet.registerApp(
            "Test App 2",
            "Test App Description 2",
            redirectUris,
            delegatees,
            emptyTools,
            emptyPolicies,
            emptyPolicyParams
        );
    }

    function testFailRemoveNonExistentRedirectUri() public {
        // First register an app
        (appId, appVersion) = _registerTestApp();

        // Try to remove a redirect URI that doesn't exist
        // This should revert with AuthorizedRedirectUriNotRegistered error
        wrappedAppFacet.removeAuthorizedRedirectUri(appId, "https://non-existent.com/callback");
    }

    function testFailToolsAndPoliciesLengthMismatch() public {
        // First register an app
        (appId, appVersion) = _registerTestApp();

        // Set up mismatched arrays
        string[] memory toolIpfsCids = new string[](2);
        toolIpfsCids[0] = TEST_TOOL_IPFS_CID_1;
        toolIpfsCids[1] = TEST_TOOL_IPFS_CID_2;

        // Only one policy for two tools (mismatch)
        string[][] memory toolPolicies = new string[][](1);
        toolPolicies[0] = new string[](1);
        toolPolicies[0][0] = TEST_POLICY_1;

        string[][][] memory toolPolicyParameterNames = new string[][][](2);
        toolPolicyParameterNames[0] = new string[][](1);
        toolPolicyParameterNames[0][0] = new string[](1);
        toolPolicyParameterNames[0][0][0] = TEST_POLICY_PARAM_1;
        toolPolicyParameterNames[1] = new string[][](1);
        toolPolicyParameterNames[1][0] = new string[](1);
        toolPolicyParameterNames[1][0][0] = TEST_POLICY_PARAM_2;

        // This should revert with ToolsAndPoliciesLengthMismatch error
        wrappedAppFacet.registerNextAppVersion(appId, toolIpfsCids, toolPolicies, toolPolicyParameterNames);
    }

    // Test simple utility functions
    function testGetTotalAppCount() public {
        // Register an app
        (appId, appVersion) = _registerTestApp();

        // Check total app count
        uint256 totalCount = wrappedAppViewFacet.getTotalAppCount();
        assertEq(totalCount, 1, "Total app count should be 1");

        // Register a second app
        // Removed domains array
        string[] memory redirectUris = new string[](1);
        redirectUris[0] = TEST_REDIRECT_URI_2;

        address[] memory delegatees = new address[](1);
        delegatees[0] = TEST_DELEGATEE_2;

        // Set up empty tool arrays
        string[] memory emptyTools = new string[](0);
        string[][] memory emptyPolicies = new string[][](0);
        string[][][] memory emptyPolicyParams = new string[][][](0);

        uint256 appId2;
        uint256 appVersion2;
        (appId2, appVersion2) = wrappedAppFacet.registerApp(
            "Test App 2",
            "Test App Description 2",
            redirectUris,
            delegatees,
            emptyTools,
            emptyPolicies,
            emptyPolicyParams
        );

        // Check updated total app count
        totalCount = wrappedAppViewFacet.getTotalAppCount();
        assertEq(totalCount, 2, "Total app count should be 2 after registering second app");
    }

    // Test hash-related functions
    // Removed testGetAuthorizedDomainByHash function as domains are no longer tracked

    function testGetAuthorizedRedirectUriByHash() public {
        // Register an app
        (appId, appVersion) = _registerTestApp();

        // Calculate hash of the redirect URI
        bytes32 redirectUriHash = keccak256(abi.encodePacked(TEST_REDIRECT_URI_1));

        // Retrieve redirect URI using hash
        string memory redirectUri = wrappedAppViewFacet.getAuthorizedRedirectUriByHash(redirectUriHash);
        assertEq(redirectUri, TEST_REDIRECT_URI_1, "Retrieved redirect URI should match the original redirect URI");
    }

    function testGetAuthorizedRedirectUrisByAppId() public {
        // Register an app
        (appId, appVersion) = _registerTestApp();

        // Add another redirect URI
        wrappedAppFacet.addAuthorizedRedirectUri(appId, TEST_REDIRECT_URI_2);

        // Retrieve redirect URIs
        string[] memory redirectUris = wrappedAppViewFacet.getAuthorizedRedirectUrisByAppId(appId);

        // Verify redirect URIs
        assertEq(redirectUris.length, 2, "Should have 2 authorized redirect URIs");
        // Check if both redirect URIs are present (order may vary)
        bool foundUri1 = false;
        bool foundUri2 = false;
        for (uint256 i = 0; i < redirectUris.length; i++) {
            if (keccak256(abi.encodePacked(redirectUris[i])) == keccak256(abi.encodePacked(TEST_REDIRECT_URI_1))) {
                foundUri1 = true;
            } else if (keccak256(abi.encodePacked(redirectUris[i])) == keccak256(abi.encodePacked(TEST_REDIRECT_URI_2)))
            {
                foundUri2 = true;
            }
        }
        assertTrue(foundUri1, "Redirect URI 1 should be in the list");
        assertTrue(foundUri2, "Redirect URI 2 should be in the list");
    }

    function testGetToolCidFromHash() public {
        // Register a tool
        wrappedToolFacet.registerTool(TEST_TOOL_IPFS_CID_1);

        // Calculate hash of the tool IPFS CID
        bytes32 toolHash = keccak256(abi.encodePacked(TEST_TOOL_IPFS_CID_1));

        // Retrieve tool IPFS CID using hash
        string memory toolIpfsCid = wrappedToolViewFacet.getToolIpfsCidByHash(toolHash);
        assertEq(toolIpfsCid, TEST_TOOL_IPFS_CID_1, "Retrieved tool IPFS CID should match the original");
    }

    function testGetAppByDelegatee() public {
        // Register an app
        (appId, appVersion) = _registerTestApp();

        // Get app by delegatee
        VincentAppViewFacet.App memory app = wrappedAppViewFacet.getAppByDelegatee(TEST_DELEGATEE_1);

        // Verify app data
        assertEq(app.name, TEST_APP_NAME, "App name doesn't match");
        assertEq(app.manager, deployer, "App manager doesn't match");

        // Test with non-delegatee address - should return an empty app with default values
        app = wrappedAppViewFacet.getAppByDelegatee(TEST_DELEGATEE_2);
        assertEq(app.name, "", "Name should be empty for non-delegatee");
    }

    function testGetAppsByManager() public {
        // First register an app
        (appId,) = _registerTestApp();

        // Set up data for the next version
        string[] memory firstAppToolIpfsCids = new string[](1);
        firstAppToolIpfsCids[0] = TEST_TOOL_IPFS_CID_1;

        // Create empty policy arrays for first app
        string[][] memory firstAppToolPolicies = new string[][](1);
        firstAppToolPolicies[0] = new string[](0);

        string[][][] memory firstAppToolPolicyParameterNames = new string[][][](1);
        firstAppToolPolicyParameterNames[0] = new string[][](0);

        // Register tool for first app
        wrappedToolFacet.registerTool(TEST_TOOL_IPFS_CID_1);

        // Register version for first app
        wrappedAppFacet.registerNextAppVersion(
            appId, firstAppToolIpfsCids, firstAppToolPolicies, firstAppToolPolicyParameterNames
        );

        // Register another app with a new version
        // Removed domains array
        string[] memory redirectUris = new string[](1);
        redirectUris[0] = TEST_REDIRECT_URI_2;

        address[] memory delegatees = new address[](1);
        delegatees[0] = TEST_DELEGATEE_2;

        // Define empty arrays for tools, policies, and policyParams
        string[] memory emptyTools = new string[](0);
        string[][] memory emptyPolicies = new string[][](0);
        string[][][] memory emptyPolicyParams = new string[][][](0);

        (uint256 appId2, uint256 appVersion2) = wrappedAppFacet.registerApp(
            "Test App 2",
            "Test App Description 2",
            redirectUris,
            delegatees,
            emptyTools,
            emptyPolicies,
            emptyPolicyParams
        );

        // Register a new version for the second app
        string[] memory toolIpfsCids = new string[](1);
        toolIpfsCids[0] = TEST_TOOL_IPFS_CID_2;

        // Create empty policy arrays
        string[][] memory toolPolicies = new string[][](1);
        toolPolicies[0] = new string[](0);

        string[][][] memory toolPolicyParameterNames = new string[][][](1);
        toolPolicyParameterNames[0] = new string[][](0);

        // Register tool for second app
        wrappedToolFacet.registerTool(TEST_TOOL_IPFS_CID_2);

        uint256 newVersion =
            wrappedAppFacet.registerNextAppVersion(appId2, toolIpfsCids, toolPolicies, toolPolicyParameterNames);

        // Get apps by manager
        VincentAppViewFacet.AppWithVersions[] memory appsWithVersions = wrappedAppViewFacet.getAppsByManager(deployer);

        // Verify we got both apps
        assertEq(appsWithVersions.length, 2, "Should return 2 apps for the manager");

        // Check first app
        assertEq(appsWithVersions[0].app.name, TEST_APP_NAME, "First app name should match");
        assertEq(appsWithVersions[0].app.latestVersion, 2, "First app should have 2 versions");
        assertEq(appsWithVersions[0].versions.length, 2, "First app should have 2 versions in the versions array");
        assertEq(appsWithVersions[0].versions[0].version, 1, "First app version should be 1");
        assertEq(appsWithVersions[0].versions[0].enabled, true, "First app version should be enabled");

        // Check second app
        assertEq(appsWithVersions[1].app.name, "Test App 2", "Second app name should match");
        assertEq(appsWithVersions[1].app.latestVersion, 2, "Second app should have 2 versions");
        assertEq(appsWithVersions[1].versions.length, 2, "Second app should have 2 versions in the versions array");
        assertEq(appsWithVersions[1].versions[0].version, 1, "First version should be 1");

        // Register a non-manager account
        vm.stopPrank();
        vm.startPrank(nonOwner);

        // Non-manager should have no apps
        VincentAppViewFacet.AppWithVersions[] memory nonManagerApps = wrappedAppViewFacet.getAppsByManager(nonOwner);
        assertEq(nonManagerApps.length, 0, "Non-manager should have 0 apps");
    }
}
