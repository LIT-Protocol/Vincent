// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "forge-std/Test.sol";
import "../../script/DeployVincentDiamond.sol";
import "../../src/VincentDiamond.sol";
import "../../src/facets/VincentAppFacet.sol";
import "../../src/facets/VincentAppViewFacet.sol";
import "../../src/facets/VincentToolFacet.sol";
import "../../src/facets/VincentToolViewFacet.sol";
import "../../src/facets/VincentUserFacet.sol";
import "../../src/facets/VincentUserViewFacet.sol";
import "../mocks/MockPKPNftFacet.sol";
import "../../src/LibVincentDiamondStorage.sol";

/**
 * @title VincentTestHelper
 * @notice Base contract that all Vincent test contracts should inherit from
 * @dev Handles setting up the Diamond pattern contracts and common test variables
 *
 * This helper provides a full testing environment for the Vincent diamond contract system.
 * It deploys a complete diamond with all facets, sets up mock dependencies, and provides
 * convenience methods and constants for testing.
 *
 * The Diamond Pattern used here follows EIP-2535 where:
 * - A single Diamond contract serves as the main contract address
 * - Multiple Facet contracts implement different sets of functionality
 * - All facets share the same storage but are accessed through the diamond
 */
abstract contract VincentTestHelper is Test {
    // ==================================================================================
    // Test accounts and mock contracts
    // ==================================================================================

    /// @notice Main deployer account with admin privileges
    address public deployer;

    /// @notice Secondary account for testing access control and permissions
    address public nonOwner;

    /// @notice Mock implementation of the PKP NFT interface used for test interactions
    /// @dev This is a lightweight mock that simulates the real PKP NFT contract
    MockPKPNftFacet public mockPkpNft;

    // ==================================================================================
    // Diamond infrastructure
    // ==================================================================================

    /// @notice The main Diamond contract instance - this is the address users interact with
    VincentDiamond public diamond;

    /// @notice The deployment script used to create and initialize the diamond
    /// @dev This is useful for full-system tests that might need to redeploy/upgrade
    DeployVincentDiamond public deployScript;

    // ==================================================================================
    // Wrapped facets - these are the interfaces for interacting with the diamond
    // ==================================================================================

    /// @notice App management facet - handles app registration and configuration
    /// @dev Through the diamond, all function calls go to address(diamond) but route to this facet
    VincentAppFacet public wrappedAppFacet;

    /// @notice App view facet - provides read-only access to app data
    VincentAppViewFacet public wrappedAppViewFacet;

    /// @notice Tool management facet - handles tool registration and approval
    VincentToolFacet public wrappedToolFacet;

    /// @notice Tool view facet - provides read-only access to tool data
    VincentToolViewFacet public wrappedToolViewFacet;

    /// @notice User management facet - handles user settings and permissions
    VincentUserFacet public wrappedUserFacet;

    /// @notice User view facet - provides read-only access to user data
    VincentUserViewFacet public wrappedUserViewFacet;

    // ==================================================================================
    // Test constants - common values used across various tests
    // ==================================================================================

    // App-related constants for consistent test data
    string constant TEST_APP_NAME = "Test App";
    string constant TEST_APP_DESCRIPTION = "Test App Description";
    string constant TEST_DOMAIN_1 = "test.com";
    string constant TEST_DOMAIN_2 = "example.com";
    string constant TEST_REDIRECT_URI_1 = "https://test.com/callback";
    string constant TEST_REDIRECT_URI_2 = "https://example.com/callback";
    address constant TEST_DELEGATEE_1 = address(0x1);
    address constant TEST_DELEGATEE_2 = address(0x2);

    // Tool-related constants - IPFS CIDs for tool identification
    string constant TEST_TOOL_IPFS_CID_1 = "QmTestTool1";
    string constant TEST_TOOL_IPFS_CID_2 = "QmTestTool2";

    // Policy-related constants for tool permissions and configurations
    string constant TEST_POLICY_1 = "QmTestPolicy1";
    string constant TEST_POLICY_2 = "QmTestPolicy2";
    string constant TEST_POLICY_PARAM_1 = "param1";
    string constant TEST_POLICY_PARAM_2 = "param2";

    // Parameter value constants for each ParameterType
    int256 constant TEST_POLICY_PARAM_INT256_VALUE = -123;
    int256[] TEST_POLICY_PARAM_INT256_ARRAY_VALUE = [int256(-1), int256(-2), int256(-3)];

    uint256 constant TEST_POLICY_PARAM_UINT256_VALUE = 456;
    uint256[] TEST_POLICY_PARAM_UINT256_ARRAY_VALUE = [uint256(1), uint256(2), uint256(3)];

    bool constant TEST_POLICY_PARAM_BOOL_VALUE = true;
    bool[] TEST_POLICY_PARAM_BOOL_ARRAY_VALUE = [true, false, true];

    address constant TEST_POLICY_PARAM_ADDRESS_VALUE = address(0x123);
    address[] TEST_POLICY_PARAM_ADDRESS_ARRAY_VALUE = [address(0x123), address(0x456), address(0x789)];

    string constant TEST_POLICY_PARAM_STRING_VALUE = "test-string-value";
    string[] TEST_POLICY_PARAM_STRING_ARRAY_VALUE = ["value1", "value2", "value3"];

    bytes constant TEST_POLICY_PARAM_BYTES_VALUE = bytes("0x1234abcd");
    bytes[] TEST_POLICY_PARAM_BYTES_ARRAY_VALUE = [bytes("0xaabb"), bytes("0xccdd"), bytes("0xeeff")];

    // PKP-related constants - token IDs for PKP NFTs
    uint256 constant TEST_PKP_TOKEN_ID_1 = 1;
    uint256 constant TEST_PKP_TOKEN_ID_2 = 2;

    // ==================================================================================
    // Pre-configured test data - initialized in setUp() for use by derived test classes
    // ==================================================================================

    /// @notice Test redirect URIs for app registration tests
    string[] internal testRedirectUris;

    /// @notice Test delegatees for app registration tests
    address[] internal testDelegatees;

    /// @notice Test tool IPFS CIDs for app registration tests
    string[] internal testToolIpfsCids;

    /// @notice Test policies for each tool (2D array: [toolIndex][policyIndex])
    string[][] internal testToolPolicies;

    /// @notice Test parameter names for each policy (3D array: [toolIndex][policyIndex][paramIndex])
    string[][][] internal testToolPolicyParameterNames;

    /// @notice Test parameter types for each policy parameter (3D array: [toolIndex][policyIndex][paramIndex])
    VincentAppStorage.ParameterType[][][] internal testToolPolicyParameterTypes;

    /// @notice Test parameter values for each policy parameter (3D array: [toolIndex][policyIndex][paramIndex])
    bytes[][][] internal testToolPolicyParameterValues;

    // ==================================================================================
    // Events - defined here for easy access in tests for event emission verification
    // ==================================================================================

    // App-related events
    event NewAppRegistered(uint256 indexed appId, address indexed manager);
    event NewAppVersionRegistered(uint256 indexed appId, uint256 indexed appVersion, address indexed manager);
    event AppEnabled(uint256 indexed appId, uint256 indexed appVersion, bool indexed enabled);
    event AuthorizedDomainAdded(uint256 indexed appId, bytes32 indexed hashedDomain);
    event AuthorizedRedirectUriAdded(uint256 indexed appId, bytes32 indexed hashedRedirectUri);
    event AuthorizedDomainRemoved(uint256 indexed appId, bytes32 indexed hashedDomain);
    event AuthorizedRedirectUriRemoved(uint256 indexed appId, bytes32 indexed hashedRedirectUri);
    event DelegateeAdded(uint256 indexed appId, address indexed delegatee);
    event DelegateeRemoved(uint256 indexed appId, address indexed delegatee);

    // Tool-related events
    event NewToolRegistered(bytes32 indexed toolIpfsCidHash);
    event ToolApproved(bytes32 indexed toolIpfsCidHash);
    event ToolApprovalRemoved(bytes32 indexed toolIpfsCidHash);
    event ApprovedToolsManagerUpdated(address indexed previousManager, address indexed newManager);

    // User-related errors
    error NotPkpOwner(uint256 pkpTokenId, address msgSender);
    error AppVersionNotRegistered(uint256 appId, uint256 appVersion);
    error DelegateeNotAssociatedWithApp(address delegatee);
    error NoRegisteredPkpsFound(address userAddress);
    error InvalidPkpTokenId();
    error EmptyToolIpfsCid();
    error EmptyPolicyIpfsCid();
    error EmptyParameterName();

    /**
     * @notice Sets up the complete testing environment for Vincent
     * @dev Deploys all contracts, configures test accounts, and initializes the system
     *
     * The setup process follows these steps:
     * 1. Configure test accounts
     * 2. Set up environment variables for deployment
     * 3. Deploy the mock PKP NFT contract (dependency)
     * 4. Deploy the complete Vincent Diamond using actual deployment script
     * 5. Create wrapped interfaces for each facet
     * 6. Configure mock PKP NFT with test data
     * 7. Initialize test data arrays for use by derived classes
     */
    function setUp() public virtual {
        // Setup deployer account using default anvil account (first account in the test environment)
        // This uses a well-known private key from Anvil/Hardhat for consistent tests
        deployer = vm.addr(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80);

        // Create secondary non-owner account for permission testing
        nonOwner = makeAddr("non-owner");

        // Set environment variables needed by the deployment script
        // This simulates how the deployment would happen in a real environment
        vm.setEnv("VINCENT_DEPLOYER_PRIVATE_KEY", "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");

        // Set the approved tools manager as the deployer for testing
        // In production, this would be a separate secure account
        vm.setEnv("APPROVED_TOOLS_MANAGER_ADDRESS", vm.toString(deployer));

        // Deploy mock dependencies first
        deployScript = new DeployVincentDiamond();
        vm.startPrank(deployer);
        mockPkpNft = new MockPKPNftFacet();
        vm.stopPrank();

        // Deploy the diamond with all facets using the actual deployment script
        // This ensures we're testing against the same deployment process used in production
        // The "test" parameter indicates we're deploying to a test environment
        address diamondAddress = deployScript.deployToNetwork("test", address(mockPkpNft));
        diamond = VincentDiamond(payable(diamondAddress));

        // Create wrapped facet instances for interacting with the diamond
        // These cast the diamond address to each facet type to access specific functions
        // In the Diamond pattern, all calls route through the Diamond but execute code from different facets
        wrappedAppFacet = VincentAppFacet(address(diamond));
        wrappedAppViewFacet = VincentAppViewFacet(address(diamond));
        wrappedToolFacet = VincentToolFacet(address(diamond));
        wrappedToolViewFacet = VincentToolViewFacet(address(diamond));
        wrappedUserFacet = VincentUserFacet(address(diamond));
        wrappedUserViewFacet = VincentUserViewFacet(address(diamond));

        // Set up mock PKP NFT ownership data for tests
        // This establishes which test accounts own which PKP tokens
        vm.startPrank(deployer);
        mockPkpNft.setOwner(TEST_PKP_TOKEN_ID_1, deployer);
        mockPkpNft.setOwner(TEST_PKP_TOKEN_ID_2, nonOwner);
        vm.stopPrank();

        // Initialize test data arrays for derived classes to use
        _initializeTestData();
    }

    /**
     * @notice Initializes test data arrays that can be used directly by derived test classes
     * @dev Called by setUp() to prepare common test structures used in app registration
     */
    function _initializeTestData() internal {
        // Set up test redirect URIs
        testRedirectUris = new string[](1);
        testRedirectUris[0] = TEST_REDIRECT_URI_1;

        // Set up test delegatees
        testDelegatees = new address[](1);
        testDelegatees[0] = TEST_DELEGATEE_1;

        // Set up test tools
        testToolIpfsCids = new string[](1);
        testToolIpfsCids[0] = TEST_TOOL_IPFS_CID_1;

        // Set up test tool policies
        testToolPolicies = new string[][](1);
        testToolPolicies[0] = new string[](1);
        testToolPolicies[0][0] = TEST_POLICY_1;

        // Set up test parameter names
        testToolPolicyParameterNames = new string[][][](1);
        testToolPolicyParameterNames[0] = new string[][](1);
        testToolPolicyParameterNames[0][0] = new string[](1);
        testToolPolicyParameterNames[0][0][0] = TEST_POLICY_PARAM_1;

        // Set up test parameter types
        testToolPolicyParameterTypes = new VincentAppStorage.ParameterType[][][](1);
        testToolPolicyParameterTypes[0] = new VincentAppStorage.ParameterType[][](1);
        testToolPolicyParameterTypes[0][0] = new VincentAppStorage.ParameterType[](1);
        testToolPolicyParameterTypes[0][0][0] = VincentAppStorage.ParameterType.STRING;

        // Set up test parameter values
        testToolPolicyParameterValues = new bytes[][][](1);
        testToolPolicyParameterValues[0] = new bytes[][](1);
        testToolPolicyParameterValues[0][0] = new bytes[](1);
        testToolPolicyParameterValues[0][0][0] = abi.encode(TEST_POLICY_PARAM_STRING_VALUE);
    }

    /**
     * @notice Helper function to register a test app with standard configuration
     * @dev Creates a standard app with one tool, one policy, and one parameter
     * @return appId The ID of the registered app
     * @return appVersion The version of the registered app
     *
     * This utility method simplifies the common testing pattern of registering an app
     * with a standard configuration. It uses the test constants defined above to create
     * a consistent test app that can be used across different test cases.
     *
     * The app structure created is:
     * - One app with one version
     * - One registered tool with IPFS CID
     * - One policy attached to the tool
     * - One parameter defined for the policy
     */
    function _registerTestApp() internal returns (uint256 appId, uint256 appVersion) {
        // Register app with version through the diamond's app facet using test data
        // This call will register both the app and its first version in one transaction
        return wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            testRedirectUris,
            testDelegatees,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );
    }
}
