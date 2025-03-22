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
     * @notice Test enabling and disabling an app version
     * @dev Verifies that app versions can be enabled and disabled by the app manager
     */
    function testEnableAppVersion() public {
        vm.startPrank(deployer);

        // Register an app
        (uint256 appId, uint256 versionNumber) = _registerTestApp();

        // Verify app version is enabled by default
        (VincentAppViewFacet.App memory app, VincentAppViewFacet.AppVersion memory versionData) =
            wrappedAppViewFacet.getAppVersion(appId, versionNumber);
        assertTrue(versionData.enabled, "App version should be enabled by default");

        // Expect the AppEnabled event with enabled = false
        vm.expectEmit(true, true, true, false);
        emit AppEnabled(appId, versionNumber, false);

        // Disable the app version
        wrappedAppFacet.enableAppVersion(appId, versionNumber, false);

        // Verify app version is now disabled
        (app, versionData) = wrappedAppViewFacet.getAppVersion(appId, versionNumber);
        assertFalse(versionData.enabled, "App version should be disabled");

        // Expect the AppEnabled event with enabled = true
        vm.expectEmit(true, true, true, false);
        emit AppEnabled(appId, versionNumber, true);

        // Re-enable the app version
        wrappedAppFacet.enableAppVersion(appId, versionNumber, true);

        // Verify app version is enabled again
        (app, versionData) = wrappedAppViewFacet.getAppVersion(appId, versionNumber);
        assertTrue(versionData.enabled, "App version should be enabled again");

        vm.stopPrank();
    }

    /**
     * @notice Test that enabling an app version to its current state fails
     * @dev Verifies the AppVersionAlreadyInRequestedState error is thrown
     */
    function testEnableAppVersionAlreadyInRequestedState() public {
        vm.startPrank(deployer);

        // Register an app
        (uint256 appId, uint256 versionNumber) = _registerTestApp();

        // App version is enabled by default, try to enable it again
        vm.expectRevert(
            abi.encodeWithSignature(
                "AppVersionAlreadyInRequestedState(uint256,uint256,bool)", appId, versionNumber, true
            )
        );

        wrappedAppFacet.enableAppVersion(appId, versionNumber, true);

        // Disable the app version
        wrappedAppFacet.enableAppVersion(appId, versionNumber, false);

        // Try to disable it again
        vm.expectRevert(
            abi.encodeWithSignature(
                "AppVersionAlreadyInRequestedState(uint256,uint256,bool)", appId, versionNumber, false
            )
        );

        wrappedAppFacet.enableAppVersion(appId, versionNumber, false);

        vm.stopPrank();
    }

    /**
     * @notice Test that only the app manager can enable/disable an app version
     * @dev Verifies the NotAppManager error is thrown for non-managers
     */
    function testEnableAppVersionNotAppManager() public {
        vm.startPrank(deployer);

        // Register an app
        (uint256 appId, uint256 versionNumber) = _registerTestApp();

        vm.stopPrank();

        // Switch to a different address (not the app manager)
        vm.startPrank(address(0xBEEF));

        // Expect the call to revert with NotAppManager error
        vm.expectRevert(abi.encodeWithSignature("NotAppManager(uint256,address)", appId, address(0xBEEF)));

        // Try to enable the app version as non-manager
        wrappedAppFacet.enableAppVersion(appId, versionNumber, false);

        vm.stopPrank();
    }

    /**
     * @notice Test adding a new authorized redirect URI to an app
     * @dev Verifies that new redirect URIs can be added by the app manager
     */
    function testAddAuthorizedRedirectUri() public {
        vm.startPrank(deployer);

        // Register an app with one redirect URI
        (uint256 appId, uint256 versionNumber) = _registerTestApp();

        // Verify initial redirect URI count
        string[] memory initialRedirectUris = wrappedAppViewFacet.getAuthorizedRedirectUrisByAppId(appId);
        assertEq(initialRedirectUris.length, 1, "Should have 1 redirect URI initially");

        // Create a new redirect URI to add
        string memory newRedirectUri = TEST_REDIRECT_URI_2;
        bytes32 hashedNewRedirectUri = keccak256(abi.encodePacked(newRedirectUri));

        // Expect the AuthorizedRedirectUriAdded event
        vm.expectEmit(true, true, false, false);
        emit AuthorizedRedirectUriAdded(appId, hashedNewRedirectUri);

        // Add a new redirect URI
        wrappedAppFacet.addAuthorizedRedirectUri(appId, newRedirectUri);

        // Verify redirect URI was added
        string[] memory updatedRedirectUris = wrappedAppViewFacet.getAuthorizedRedirectUrisByAppId(appId);
        assertEq(updatedRedirectUris.length, 2, "Should have 2 redirect URIs after adding");

        // Verify both URIs exist
        bool foundOriginalUri = false;
        bool foundNewUri = false;

        for (uint256 i = 0; i < updatedRedirectUris.length; i++) {
            bytes32 uriHash = keccak256(abi.encodePacked(updatedRedirectUris[i]));
            if (uriHash == keccak256(abi.encodePacked(TEST_REDIRECT_URI_1))) {
                foundOriginalUri = true;
            } else if (uriHash == keccak256(abi.encodePacked(TEST_REDIRECT_URI_2))) {
                foundNewUri = true;
            }
        }

        assertTrue(foundOriginalUri, "Original URI should still exist");
        assertTrue(foundNewUri, "New URI should be added");

        vm.stopPrank();
    }

    /**
     * @notice Test adding a duplicate redirect URI
     * @dev Verifies the RedirectUriAlreadyAuthorizedForApp error is thrown
     */
    function testAddDuplicateAuthorizedRedirectUri() public {
        vm.startPrank(deployer);

        // Register an app with one redirect URI
        (uint256 appId, uint256 versionNumber) = _registerTestApp();

        // Try to add the same redirect URI again
        vm.expectRevert(
            abi.encodeWithSignature("RedirectUriAlreadyAuthorizedForApp(uint256,string)", appId, TEST_REDIRECT_URI_1)
        );

        wrappedAppFacet.addAuthorizedRedirectUri(appId, TEST_REDIRECT_URI_1);

        vm.stopPrank();
    }

    /**
     * @notice Test that only the app manager can add redirect URIs
     * @dev Verifies the NotAppManager error is thrown for non-managers
     */
    function testAddAuthorizedRedirectUriNotAppManager() public {
        vm.startPrank(deployer);

        // Register an app
        (uint256 appId, uint256 versionNumber) = _registerTestApp();

        vm.stopPrank();

        // Switch to a different address (not the app manager)
        vm.startPrank(address(0xBEEF));

        // Expect the call to revert with NotAppManager error
        vm.expectRevert(abi.encodeWithSignature("NotAppManager(uint256,address)", appId, address(0xBEEF)));

        // Try to add a redirect URI as non-manager
        wrappedAppFacet.addAuthorizedRedirectUri(appId, TEST_REDIRECT_URI_2);

        vm.stopPrank();
    }

    /**
     * @notice Test removing an authorized redirect URI from an app
     * @dev Verifies that redirect URIs can be removed by the app manager
     */
    function testRemoveAuthorizedRedirectUri() public {
        vm.startPrank(deployer);

        // Register an app with two redirect URIs
        string[] memory twoRedirectUris = new string[](2);
        twoRedirectUris[0] = TEST_REDIRECT_URI_1;
        twoRedirectUris[1] = TEST_REDIRECT_URI_2;

        // Register app with two redirect URIs
        (uint256 appId, uint256 versionNumber) = wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            twoRedirectUris,
            testDelegatees,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        // Verify initial redirect URI count
        string[] memory initialRedirectUris = wrappedAppViewFacet.getAuthorizedRedirectUrisByAppId(appId);
        assertEq(initialRedirectUris.length, 2, "Should have 2 redirect URIs initially");

        // Get the hash of the redirect URI we'll remove
        bytes32 hashedRedirectUri = keccak256(abi.encodePacked(TEST_REDIRECT_URI_1));

        // Expect the AuthorizedRedirectUriRemoved event
        vm.expectEmit(true, true, false, false);
        emit AuthorizedRedirectUriRemoved(appId, hashedRedirectUri);

        // Remove a redirect URI
        wrappedAppFacet.removeAuthorizedRedirectUri(appId, TEST_REDIRECT_URI_1);

        // Verify redirect URI was removed
        string[] memory updatedRedirectUris = wrappedAppViewFacet.getAuthorizedRedirectUrisByAppId(appId);
        assertEq(updatedRedirectUris.length, 1, "Should have 1 redirect URI after removal");

        // Verify the remaining URI is the correct one
        assertEq(
            keccak256(abi.encodePacked(updatedRedirectUris[0])),
            keccak256(abi.encodePacked(TEST_REDIRECT_URI_2)),
            "The remaining URI should be the second one"
        );

        vm.stopPrank();
    }

    /**
     * @notice Test that removing a non-existent redirect URI fails
     * @dev Verifies the RedirectUriNotRegisteredToApp error is thrown
     */
    function testRemoveNonExistentRedirectUri() public {
        vm.startPrank(deployer);

        // Register an app with one redirect URI
        (uint256 appId, uint256 versionNumber) = _registerTestApp();

        // Try to remove a redirect URI that doesn't exist
        string memory nonExistentUri = "https://non-existent.com/callback";

        vm.expectRevert(abi.encodeWithSignature("RedirectUriNotRegisteredToApp(uint256,string)", appId, nonExistentUri));

        wrappedAppFacet.removeAuthorizedRedirectUri(appId, nonExistentUri);

        vm.stopPrank();
    }

    /**
     * @notice Test that removing the last redirect URI fails
     * @dev Verifies the CannotRemoveLastRedirectUri error is thrown
     */
    function testRemoveLastRedirectUri() public {
        vm.startPrank(deployer);

        // Register an app with one redirect URI
        (uint256 appId, uint256 versionNumber) = _registerTestApp();

        // Try to remove the only redirect URI
        vm.expectRevert(abi.encodeWithSignature("CannotRemoveLastRedirectUri(uint256)", appId));

        wrappedAppFacet.removeAuthorizedRedirectUri(appId, TEST_REDIRECT_URI_1);

        vm.stopPrank();
    }

    /**
     * @notice Test that only the app manager can remove redirect URIs
     * @dev Verifies the NotAppManager error is thrown for non-managers
     */
    function testRemoveAuthorizedRedirectUriNotAppManager() public {
        vm.startPrank(deployer);

        // Register an app with two redirect URIs
        string[] memory twoRedirectUris = new string[](2);
        twoRedirectUris[0] = TEST_REDIRECT_URI_1;
        twoRedirectUris[1] = TEST_REDIRECT_URI_2;

        (uint256 appId, uint256 versionNumber) = wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            twoRedirectUris,
            testDelegatees,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        vm.stopPrank();

        // Switch to a different address (not the app manager)
        vm.startPrank(address(0xBEEF));

        // Expect the call to revert with NotAppManager error
        vm.expectRevert(abi.encodeWithSignature("NotAppManager(uint256,address)", appId, address(0xBEEF)));

        // Try to remove a redirect URI as non-manager
        wrappedAppFacet.removeAuthorizedRedirectUri(appId, TEST_REDIRECT_URI_1);

        vm.stopPrank();
    }

    /**
     * @notice Test adding a delegatee to an app
     * @dev Verifies that delegatees can be added by the app manager
     */
    function testAddDelegatee() public {
        vm.startPrank(deployer);

        // Register an app with one delegatee
        (uint256 appId, uint256 versionNumber) = _registerTestApp();

        // Verify initial delegatee count
        VincentAppViewFacet.App memory app = wrappedAppViewFacet.getAppById(appId);
        assertEq(app.delegatees.length, 1, "Should have 1 delegatee initially");
        assertEq(app.delegatees[0], TEST_DELEGATEE_1, "Initial delegatee should match");

        // Create a new delegatee to add
        address newDelegatee = address(0xCAFE);

        // Expect the DelegateeAdded event
        vm.expectEmit(true, true, false, false);
        emit DelegateeAdded(appId, newDelegatee);

        // Add a new delegatee
        wrappedAppFacet.addDelegatee(appId, newDelegatee);

        // Verify delegatee was added
        app = wrappedAppViewFacet.getAppById(appId);
        assertEq(app.delegatees.length, 2, "Should have 2 delegatees after adding");

        // Verify both delegatees exist
        bool foundOriginalDelegatee = false;
        bool foundNewDelegatee = false;

        for (uint256 i = 0; i < app.delegatees.length; i++) {
            if (app.delegatees[i] == TEST_DELEGATEE_1) {
                foundOriginalDelegatee = true;
            } else if (app.delegatees[i] == newDelegatee) {
                foundNewDelegatee = true;
            }
        }

        assertTrue(foundOriginalDelegatee, "Original delegatee should still exist");
        assertTrue(foundNewDelegatee, "New delegatee should be added");

        vm.stopPrank();
    }

    /**
     * @notice Test adding a delegatee already registered to another app
     * @dev Verifies the DelegateeAlreadyRegisteredToApp error is thrown
     */
    function testAddDelegateeAlreadyRegistered() public {
        vm.startPrank(deployer);

        // Register first app with a delegatee
        (uint256 firstAppId, uint256 firstVersionNumber) = _registerTestApp();

        // Register a second app with a different delegatee
        address[] memory secondAppDelegatees = new address[](1);
        secondAppDelegatees[0] = TEST_DELEGATEE_2;

        (uint256 secondAppId, uint256 secondVersionNumber) = wrappedAppFacet.registerApp(
            "Second App",
            "Second App Description",
            testRedirectUris,
            secondAppDelegatees,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        // Try to add the delegatee from the first app to the second app
        vm.expectRevert(
            abi.encodeWithSignature("DelegateeAlreadyRegisteredToApp(uint256,address)", firstAppId, TEST_DELEGATEE_1)
        );

        wrappedAppFacet.addDelegatee(secondAppId, TEST_DELEGATEE_1);

        vm.stopPrank();
    }

    /**
     * @notice Test that only the app manager can add delegatees
     * @dev Verifies the NotAppManager error is thrown for non-managers
     */
    function testAddDelegateeNotAppManager() public {
        vm.startPrank(deployer);

        // Register an app
        (uint256 appId, uint256 versionNumber) = _registerTestApp();

        vm.stopPrank();

        // Switch to a different address (not the app manager)
        vm.startPrank(address(0xBEEF));

        // Expect the call to revert with NotAppManager error
        vm.expectRevert(abi.encodeWithSignature("NotAppManager(uint256,address)", appId, address(0xBEEF)));

        // Try to add a delegatee as non-manager
        wrappedAppFacet.addDelegatee(appId, address(0xCAFE));

        vm.stopPrank();
    }

    /**
     * @notice Test removing a delegatee from an app
     * @dev Verifies that delegatees can be removed by the app manager
     */
    function testRemoveDelegatee() public {
        vm.startPrank(deployer);

        // Register an app with two delegatees
        address[] memory twoDelegatees = new address[](2);
        twoDelegatees[0] = TEST_DELEGATEE_1;
        twoDelegatees[1] = TEST_DELEGATEE_2;

        (uint256 appId, uint256 versionNumber) = wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            testRedirectUris,
            twoDelegatees,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        // Verify initial delegatee count
        VincentAppViewFacet.App memory app = wrappedAppViewFacet.getAppById(appId);
        assertEq(app.delegatees.length, 2, "Should have 2 delegatees initially");

        // Expect the DelegateeRemoved event
        vm.expectEmit(true, true, false, false);
        emit DelegateeRemoved(appId, TEST_DELEGATEE_1);

        // Remove a delegatee
        wrappedAppFacet.removeDelegatee(appId, TEST_DELEGATEE_1);

        // Verify delegatee was removed
        app = wrappedAppViewFacet.getAppById(appId);
        assertEq(app.delegatees.length, 1, "Should have 1 delegatee after removal");

        // Verify the remaining delegatee is the correct one
        assertEq(app.delegatees[0], TEST_DELEGATEE_2, "The remaining delegatee should be the second one");

        address[] memory secondAppDelegatees = new address[](1);
        secondAppDelegatees[0] = TEST_DELEGATEE_1; // Use the previously removed delegatee

        // Should be able to register a new app with the removed delegatee
        (uint256 secondAppId, uint256 secondAppVersion) = wrappedAppFacet.registerApp(
            "Second App",
            "Second App Description",
            testRedirectUris,
            secondAppDelegatees,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        // Verify the delegatee was added to the second app
        VincentAppViewFacet.App memory secondApp = wrappedAppViewFacet.getAppById(secondAppId);
        assertEq(secondApp.delegatees.length, 1, "Second app should have 1 delegatee");
        assertEq(secondApp.delegatees[0], TEST_DELEGATEE_1, "Second app delegatee should match");

        vm.stopPrank();
    }

    /**
     * @notice Test removing a delegatee not registered to the app
     * @dev Verifies the DelegateeNotRegisteredToApp error is thrown
     */
    function testRemoveDelegateeNotRegistered() public {
        vm.startPrank(deployer);

        // Register an app with one delegatee
        (uint256 appId, uint256 versionNumber) = _registerTestApp();

        // Try to remove a delegatee that's not registered to the app
        address nonRegisteredDelegatee = address(0xCAFE);

        vm.expectRevert(
            abi.encodeWithSignature("DelegateeNotRegisteredToApp(uint256,address)", appId, nonRegisteredDelegatee)
        );

        wrappedAppFacet.removeDelegatee(appId, nonRegisteredDelegatee);

        vm.stopPrank();
    }

    /**
     * @notice Test that only the app manager can remove delegatees
     * @dev Verifies the NotAppManager error is thrown for non-managers
     */
    function testRemoveDelegateeNotAppManager() public {
        vm.startPrank(deployer);

        // Register an app with one delegatee
        (uint256 appId, uint256 versionNumber) = _registerTestApp();

        vm.stopPrank();

        // Switch to a different address (not the app manager)
        vm.startPrank(address(0xBEEF));

        // Expect the call to revert with NotAppManager error
        vm.expectRevert(abi.encodeWithSignature("NotAppManager(uint256,address)", appId, address(0xBEEF)));

        // Try to remove a delegatee as non-manager
        wrappedAppFacet.removeDelegatee(appId, TEST_DELEGATEE_1);

        vm.stopPrank();
    }

    /**
     * @notice Test suite for VincentAppViewFacet
     * @dev Tests all view methods of the VincentAppViewFacet
     */

    /**
     * @notice Test getting the total app count
     * @dev Verifies that getTotalAppCount returns the correct number of apps
     */
    function testGetTotalAppCount() public {
        vm.startPrank(deployer);

        // Initial state - no apps registered
        assertEq(wrappedAppViewFacet.getTotalAppCount(), 0, "Initial app count should be 0");

        // Register an app
        _registerTestApp();
        assertEq(wrappedAppViewFacet.getTotalAppCount(), 1, "After registering 1 app, count should be 1");

        // Register another app
        address[] memory secondAppDelegatees = new address[](1);
        secondAppDelegatees[0] = TEST_DELEGATEE_2;

        wrappedAppFacet.registerApp(
            "Second App",
            "Second App Description",
            testRedirectUris,
            secondAppDelegatees,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        assertEq(wrappedAppViewFacet.getTotalAppCount(), 2, "After registering 2 apps, count should be 2");

        vm.stopPrank();
    }

    /**
     * @notice Test getting app by ID
     * @dev Verifies that getAppById returns the correct app data
     */
    function testGetAppById() public {
        vm.startPrank(deployer);

        // Register an app
        (uint256 appId, uint256 versionNumber) = _registerTestApp();

        // Get the app by ID
        VincentAppViewFacet.App memory app = wrappedAppViewFacet.getAppById(appId);

        // Verify app data
        assertEq(app.id, appId, "App ID should match");
        assertEq(
            keccak256(abi.encodePacked(app.name)), keccak256(abi.encodePacked(TEST_APP_NAME)), "App name should match"
        );
        assertEq(
            keccak256(abi.encodePacked(app.description)),
            keccak256(abi.encodePacked(TEST_APP_DESCRIPTION)),
            "App description should match"
        );
        assertEq(app.manager, deployer, "App manager should be deployer");
        assertEq(app.latestVersion, 1, "App latest version should be 1");
        assertEq(app.delegatees.length, 1, "App should have 1 delegatee");
        assertEq(app.delegatees[0], TEST_DELEGATEE_1, "App delegatee should match");
        assertEq(app.authorizedRedirectUris.length, 1, "App should have 1 redirect URI");
        assertEq(
            keccak256(abi.encodePacked(app.authorizedRedirectUris[0])),
            keccak256(abi.encodePacked(TEST_REDIRECT_URI_1)),
            "App redirect URI should match"
        );

        vm.stopPrank();
    }

    /**
     * @notice Test getting app by non-existent ID
     * @dev Verifies that getAppById reverts when given a non-existent app ID
     */
    function testGetAppByIdNonExistent() public {
        vm.startPrank(deployer);

        // Try to get a non-existent app
        uint256 nonExistentAppId = 999;
        vm.expectRevert(abi.encodeWithSignature("AppNotRegistered(uint256)", nonExistentAppId));
        wrappedAppViewFacet.getAppById(nonExistentAppId);

        vm.stopPrank();
    }

    /**
     * @notice Test getting app version
     * @dev Verifies that getAppVersion returns the correct app version data
     */
    function testGetAppVersion() public {
        vm.startPrank(deployer);

        // Register an app
        (uint256 appId, uint256 versionNumber) = _registerTestApp();

        // Get the app version
        (VincentAppViewFacet.App memory app, VincentAppViewFacet.AppVersion memory version) =
            wrappedAppViewFacet.getAppVersion(appId, versionNumber);

        // Verify app data
        assertEq(app.id, appId, "App ID should match");
        assertEq(
            keccak256(abi.encodePacked(app.name)), keccak256(abi.encodePacked(TEST_APP_NAME)), "App name should match"
        );

        // Verify version data
        assertEq(version.version, versionNumber, "Version number should match");
        assertTrue(version.enabled, "Version should be enabled");
        assertEq(version.tools.length, 1, "Version should have 1 tool");
        assertEq(
            keccak256(abi.encodePacked(version.tools[0].toolIpfsCid)),
            keccak256(abi.encodePacked(TEST_TOOL_IPFS_CID_1)),
            "Tool IPFS CID should match"
        );
        assertEq(version.tools[0].policies.length, 1, "Tool should have 1 policy");
        assertEq(
            keccak256(abi.encodePacked(version.tools[0].policies[0].policyIpfsCid)),
            keccak256(abi.encodePacked(TEST_POLICY_1)),
            "Policy IPFS CID should match"
        );
        assertEq(version.tools[0].policies[0].parameterNames.length, 1, "Policy should have 1 parameter name");
        assertEq(
            keccak256(abi.encodePacked(version.tools[0].policies[0].parameterNames[0])),
            keccak256(abi.encodePacked(TEST_POLICY_PARAM_1)),
            "Parameter name should match"
        );
        assertEq(version.tools[0].policies[0].parameterTypes.length, 1, "Policy should have 1 parameter type");
        assertEq(
            uint256(version.tools[0].policies[0].parameterTypes[0]),
            uint256(VincentAppStorage.ParameterType.STRING),
            "Parameter type should match"
        );

        vm.stopPrank();
    }

    /**
     * @notice Test getting app version with non-existent app ID
     * @dev Verifies that getAppVersion reverts when given a non-existent app ID
     */
    function testGetAppVersionNonExistentApp() public {
        vm.startPrank(deployer);

        // Try to get a non-existent app version
        uint256 nonExistentAppId = 999;
        uint256 versionNumber = 1;
        vm.expectRevert(abi.encodeWithSignature("AppNotRegistered(uint256)", nonExistentAppId));
        wrappedAppViewFacet.getAppVersion(nonExistentAppId, versionNumber);

        vm.stopPrank();
    }

    /**
     * @notice Test getting app version with non-existent version number
     * @dev Verifies that getAppVersion reverts when given a non-existent version number
     */
    function testGetAppVersionNonExistentVersion() public {
        vm.startPrank(deployer);

        // Register an app
        (uint256 appId, uint256 versionNumber) = _registerTestApp();

        // Try to get a non-existent version
        uint256 nonExistentVersionNumber = 999;
        vm.expectRevert(
            abi.encodeWithSignature("AppVersionNotRegistered(uint256,uint256)", appId, nonExistentVersionNumber)
        );
        wrappedAppViewFacet.getAppVersion(appId, nonExistentVersionNumber);

        vm.stopPrank();
    }

    /**
     * @notice Test getting apps by manager
     * @dev Verifies that getAppsByManager returns all apps for a manager
     */
    function testGetAppsByManager() public {
        vm.startPrank(deployer);

        // Register two apps
        (uint256 firstAppId, uint256 firstAppVersion) = _registerTestApp();

        address[] memory secondAppDelegatees = new address[](1);
        secondAppDelegatees[0] = TEST_DELEGATEE_2;

        (uint256 secondAppId, uint256 secondAppVersion) = wrappedAppFacet.registerApp(
            "Second App",
            "Second App Description",
            testRedirectUris,
            secondAppDelegatees,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        // Get apps by manager
        VincentAppViewFacet.AppWithVersions[] memory appsWithVersions = wrappedAppViewFacet.getAppsByManager(deployer);

        // Verify apps count
        assertEq(appsWithVersions.length, 2, "Manager should have 2 apps");

        // Verify first app data
        assertEq(appsWithVersions[0].app.id, firstAppId, "First app ID should match");
        assertEq(
            keccak256(abi.encodePacked(appsWithVersions[0].app.name)),
            keccak256(abi.encodePacked(TEST_APP_NAME)),
            "First app name should match"
        );
        assertEq(appsWithVersions[0].versions.length, 1, "First app should have 1 version");
        assertEq(appsWithVersions[0].versions[0].version, 1, "First app version number should be 1");

        // Verify second app data
        assertEq(appsWithVersions[1].app.id, secondAppId, "Second app ID should match");
        assertEq(
            keccak256(abi.encodePacked(appsWithVersions[1].app.name)),
            keccak256(abi.encodePacked("Second App")),
            "Second app name should match"
        );
        assertEq(appsWithVersions[1].versions.length, 1, "Second app should have 1 version");
        assertEq(appsWithVersions[1].versions[0].version, 1, "Second app version number should be 1");

        vm.stopPrank();
    }

    /**
     * @notice Test getting apps by a manager with no apps
     * @dev Verifies that getAppsByManager reverts when given a manager with no apps
     */
    function testGetAppsByManagerNoApps() public {
        vm.startPrank(deployer);

        // Try to get apps for a manager with no apps
        address managerWithNoApps = address(0xBEEF);
        vm.expectRevert(abi.encodeWithSignature("NoAppsFoundForManager(address)", managerWithNoApps));
        wrappedAppViewFacet.getAppsByManager(managerWithNoApps);

        vm.stopPrank();
    }

    /**
     * @notice Test getting apps by zero address
     * @dev Verifies that getAppsByManager reverts when given a zero address
     */
    function testGetAppsByManagerZeroAddress() public {
        vm.startPrank(deployer);

        // Try to get apps for zero address
        vm.expectRevert(abi.encodeWithSignature("ZeroAddressNotAllowed()"));
        wrappedAppViewFacet.getAppsByManager(address(0));

        vm.stopPrank();
    }

    /**
     * @notice Test getting app by delegatee
     * @dev Verifies that getAppByDelegatee returns the correct app
     */
    function testGetAppByDelegatee() public {
        vm.startPrank(deployer);

        // Register an app
        (uint256 appId, uint256 versionNumber) = _registerTestApp();

        // Get app by delegatee
        VincentAppViewFacet.App memory app = wrappedAppViewFacet.getAppByDelegatee(TEST_DELEGATEE_1);

        // Verify app data
        assertEq(app.id, appId, "App ID should match");
        assertEq(
            keccak256(abi.encodePacked(app.name)), keccak256(abi.encodePacked(TEST_APP_NAME)), "App name should match"
        );
        assertEq(app.delegatees.length, 1, "App should have 1 delegatee");
        assertEq(app.delegatees[0], TEST_DELEGATEE_1, "App delegatee should match");

        vm.stopPrank();
    }

    /**
     * @notice Test getting app by a non-registered delegatee
     * @dev Verifies that getAppByDelegatee reverts when given a non-registered delegatee
     */
    function testGetAppByDelegateeNotRegistered() public {
        vm.startPrank(deployer);

        // Try to get app for a non-registered delegatee
        address nonRegisteredDelegatee = address(0xCAFE);
        vm.expectRevert(abi.encodeWithSignature("DelegateeNotRegistered(address)", nonRegisteredDelegatee));
        wrappedAppViewFacet.getAppByDelegatee(nonRegisteredDelegatee);

        vm.stopPrank();
    }

    /**
     * @notice Test getting app by zero address delegatee
     * @dev Verifies that getAppByDelegatee reverts when given a zero address
     */
    function testGetAppByDelegateeZeroAddress() public {
        vm.startPrank(deployer);

        // Try to get app for zero address
        vm.expectRevert(abi.encodeWithSignature("ZeroAddressNotAllowed()"));
        wrappedAppViewFacet.getAppByDelegatee(address(0));

        vm.stopPrank();
    }

    /**
     * @notice Test getting authorized redirect URI by hash
     * @dev Verifies that getAuthorizedRedirectUriByHash returns the correct redirect URI
     */
    function testGetAuthorizedRedirectUriByHash() public {
        vm.startPrank(deployer);

        // Register an app
        (uint256 appId, uint256 versionNumber) = _registerTestApp();

        // Get the hash of the redirect URI
        bytes32 redirectUriHash = keccak256(abi.encodePacked(TEST_REDIRECT_URI_1));

        // Get redirect URI by hash
        string memory redirectUri = wrappedAppViewFacet.getAuthorizedRedirectUriByHash(redirectUriHash);

        // Verify redirect URI
        assertEq(
            keccak256(abi.encodePacked(redirectUri)),
            keccak256(abi.encodePacked(TEST_REDIRECT_URI_1)),
            "Redirect URI should match"
        );

        vm.stopPrank();
    }

    /**
     * @notice Test getting authorized redirect URI by non-existent hash
     * @dev Verifies that getAuthorizedRedirectUriByHash reverts when given a non-existent hash
     */
    function testGetAuthorizedRedirectUriByHashNotFound() public {
        vm.startPrank(deployer);

        // Try to get redirect URI for a non-existent hash
        bytes32 nonExistentHash = keccak256(abi.encodePacked("non-existent"));
        vm.expectRevert(abi.encodeWithSignature("RedirectUriNotFound(bytes32)", nonExistentHash));
        wrappedAppViewFacet.getAuthorizedRedirectUriByHash(nonExistentHash);

        vm.stopPrank();
    }

    /**
     * @notice Test getting authorized redirect URIs by app ID
     * @dev Verifies that getAuthorizedRedirectUrisByAppId returns all redirect URIs for an app
     */
    function testGetAuthorizedRedirectUrisByAppId() public {
        vm.startPrank(deployer);

        // Register an app with multiple redirect URIs
        string[] memory multipleRedirectUris = new string[](2);
        multipleRedirectUris[0] = TEST_REDIRECT_URI_1;
        multipleRedirectUris[1] = TEST_REDIRECT_URI_2;

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

        // Get redirect URIs by app ID
        string[] memory redirectUris = wrappedAppViewFacet.getAuthorizedRedirectUrisByAppId(appId);

        // Verify redirect URIs count
        assertEq(redirectUris.length, 2, "App should have 2 redirect URIs");

        // Verify redirect URIs (order is not guaranteed)
        bool foundUri1 = false;
        bool foundUri2 = false;

        for (uint256 i = 0; i < redirectUris.length; i++) {
            bytes32 uriHash = keccak256(abi.encodePacked(redirectUris[i]));
            if (uriHash == keccak256(abi.encodePacked(TEST_REDIRECT_URI_1))) {
                foundUri1 = true;
            } else if (uriHash == keccak256(abi.encodePacked(TEST_REDIRECT_URI_2))) {
                foundUri2 = true;
            }
        }

        assertTrue(foundUri1, "Should contain first redirect URI");
        assertTrue(foundUri2, "Should contain second redirect URI");

        vm.stopPrank();
    }

    /**
     * @notice Test getting authorized redirect URIs by non-existent app ID
     * @dev Verifies that getAuthorizedRedirectUrisByAppId reverts when given a non-existent app ID
     */
    function testGetAuthorizedRedirectUrisByAppIdNonExistent() public {
        vm.startPrank(deployer);

        // Try to get redirect URIs for a non-existent app
        uint256 nonExistentAppId = 999;
        vm.expectRevert(abi.encodeWithSignature("AppNotRegistered(uint256)", nonExistentAppId));
        wrappedAppViewFacet.getAuthorizedRedirectUrisByAppId(nonExistentAppId);

        vm.stopPrank();
    }

    /**
     * @notice Test adding an empty redirect URI to an existing app
     * @dev Verifies that adding an empty redirect URI fails with EmptyRedirectUriNotAllowed error
     */
    function testAddEmptyRedirectUri() public {
        vm.startPrank(deployer);

        // First register a valid app
        (uint256 appId,) = _registerTestApp();

        // Expect the call to revert with EmptyRedirectUriNotAllowed error
        vm.expectRevert(abi.encodeWithSignature("EmptyRedirectUriNotAllowed()"));

        // Try to add an empty redirect URI to the existing app
        wrappedAppFacet.addAuthorizedRedirectUri(appId, "");

        vm.stopPrank();
    }

    /**
     * @notice Test adding a zero address delegatee to an existing app
     * @dev Verifies that adding a zero address delegatee fails with ZeroAddressDelegateeNotAllowed error
     */
    function testAddZeroAddressDelegatee() public {
        vm.startPrank(deployer);

        // First register a valid app
        (uint256 appId,) = _registerTestApp();

        // Expect the call to revert with ZeroAddressDelegateeNotAllowed error
        vm.expectRevert(abi.encodeWithSignature("ZeroAddressDelegateeNotAllowed()"));

        // Try to add a zero address delegatee to the existing app
        wrappedAppFacet.addDelegatee(appId, address(0));

        vm.stopPrank();
    }
}
