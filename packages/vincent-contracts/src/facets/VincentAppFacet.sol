// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "../LibVincentDiamondStorage.sol";
import "../VincentBase.sol";

interface IVincentToolFacet {
    function registerTool(string calldata toolIpfsCid) external;
}

contract VincentAppFacet is VincentBase {
    using VincentAppStorage for VincentAppStorage.AppStorage;
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    event NewManagerRegistered(address indexed manager);
    event NewAppRegistered(uint256 indexed appId, address indexed manager);
    event NewAppVersionRegistered(uint256 indexed appId, uint256 indexed appVersion, address indexed manager);
    event AppEnabled(uint256 indexed appId, uint256 indexed appVersion, bool indexed enabled);
    event AuthorizedDomainAdded(uint256 indexed appId, string indexed domain);
    event AuthorizedRedirectUriAdded(uint256 indexed appId, string indexed redirectUri);
    event AuthorizedDomainRemoved(uint256 indexed appId, string indexed domain);
    event AuthorizedRedirectUriRemoved(uint256 indexed appId, string indexed redirectUri);

    error NotAppManager(uint256 appId, address msgSender);
    error ToolsAndPoliciesLengthMismatch();
    error DelegateeAlreadyRegisteredToApp(uint256 appId, address delegatee);
    error DelegateeNotRegisteredToApp(uint256 appId, address delegatee);
    error AuthorizedDomainNotRegistered(uint256 appId, bytes32 hashedDomain);
    error AuthorizedRedirectUriNotRegistered(uint256 appId, bytes32 hashedRedirectUri);

    modifier onlyAppManager(uint256 appId) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        if (as_.appIdToApp[appId].manager != msg.sender) revert NotAppManager(appId, msg.sender);
        _;
    }

    function registerApp(
        string calldata name,
        string calldata description,
        string[] calldata authorizedDomains,
        string[] calldata authorizedRedirectUris,
        address[] calldata delegatees
    ) public returns (uint256 newAppId) {
        newAppId = _registerApp(name, description, authorizedDomains, authorizedRedirectUris, delegatees);

        // Add the manager to the list of registered managers
        // if they are not already in the list
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        if (!as_.registeredManagers.contains(msg.sender)) {
            as_.registeredManagers.add(msg.sender);
            emit NewManagerRegistered(msg.sender);
        }

        emit NewAppRegistered(newAppId, msg.sender);
    }

    function registerAppWithVersion(
        string calldata name,
        string calldata description,
        string[] calldata authorizedDomains,
        string[] calldata authorizedRedirectUris,
        address[] calldata delegatees,
        string[] calldata toolIpfsCids,
        string[][] calldata toolPolicies,
        string[][][] calldata toolPolicyParameterNames
    ) public returns (uint256 newAppId, uint256 newAppVersion) {
        newAppId = _registerApp(name, description, authorizedDomains, authorizedRedirectUris, delegatees);
        newAppVersion = _registerNextAppVersion(newAppId, toolIpfsCids, toolPolicies, toolPolicyParameterNames);

        // Add the manager to the list of registered managers
        // if they are not already in the list
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        if (!as_.registeredManagers.contains(msg.sender)) {
            as_.registeredManagers.add(msg.sender);
            emit NewManagerRegistered(msg.sender);
        }

        emit NewAppRegistered(newAppId, msg.sender);
        emit NewAppVersionRegistered(newAppId, newAppVersion, msg.sender);
    }

    function registerNextAppVersion(
        uint256 appId,
        string[] calldata toolIpfsCids,
        string[][] calldata toolPolicies,
        string[][][] calldata toolPolicyParameterNames
    ) public onlyAppManager(appId) onlyRegisteredApp(appId) returns (uint256 newAppVersion) {
        newAppVersion = _registerNextAppVersion(appId, toolIpfsCids, toolPolicies, toolPolicyParameterNames);

        emit NewAppVersionRegistered(appId, newAppVersion, msg.sender);
    }

    function enableAppVersion(uint256 appId, uint256 appVersion, bool enabled)
        external
        onlyAppManager(appId)
        onlyRegisteredApp(appId)
        onlyRegisteredAppVersion(appId, appVersion)
    {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        // App versions start at 1, but the appVersions array is 0-indexed
        as_.appIdToApp[appId].versionedApps[appVersion - 1].enabled = enabled;
        emit AppEnabled(appId, appVersion, enabled);
    }

    function addAuthorizedDomain(uint256 appId, string calldata domain)
        external
        onlyAppManager(appId)
        onlyRegisteredApp(appId)
    {
        _addAuthorizedDomain(appId, domain);
    }

    function removeAuthorizedDomain(uint256 appId, string calldata domain)
        external
        onlyAppManager(appId)
        onlyRegisteredApp(appId)
    {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        bytes32 hashedDomain = keccak256(abi.encodePacked(domain));

        if (!as_.appIdToApp[appId].authorizedDomains.contains(hashedDomain)) {
            revert AuthorizedDomainNotRegistered(appId, hashedDomain);
        }

        as_.appIdToApp[appId].authorizedDomains.remove(hashedDomain);
        delete as_.authorizedDomainHashToDomain[hashedDomain];

        emit AuthorizedDomainRemoved(appId, domain);
    }

    function addAuthorizedRedirectUri(uint256 appId, string calldata redirectUri)
        external
        onlyAppManager(appId)
        onlyRegisteredApp(appId)
    {
        _addAuthorizedRedirectUri(appId, redirectUri);
    }

    function removeAuthorizedRedirectUri(uint256 appId, string calldata redirectUri)
        external
        onlyAppManager(appId)
        onlyRegisteredApp(appId)
    {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        bytes32 hashedRedirectUri = keccak256(abi.encodePacked(redirectUri));

        if (!as_.appIdToApp[appId].authorizedRedirectUris.contains(hashedRedirectUri)) {
            revert AuthorizedRedirectUriNotRegistered(appId, hashedRedirectUri);
        }

        as_.appIdToApp[appId].authorizedRedirectUris.remove(hashedRedirectUri);
        delete as_.authorizedRedirectUriHashToRedirectUri[hashedRedirectUri];

        emit AuthorizedRedirectUriRemoved(appId, redirectUri);
    }

    function addDelegatee(uint256 appId, address delegatee) external onlyAppManager(appId) onlyRegisteredApp(appId) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        uint256 delegateeAppId = as_.delegateeAddressToAppId[delegatee];
        if (delegateeAppId != 0) revert DelegateeAlreadyRegisteredToApp(delegateeAppId, delegatee);

        as_.appIdToApp[appId].delegatees.add(delegatee);
        as_.delegateeAddressToAppId[delegatee] = appId;
    }

    function removeDelegatee(uint256 appId, address delegatee)
        external
        onlyAppManager(appId)
        onlyRegisteredApp(appId)
    {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        if (as_.delegateeAddressToAppId[delegatee] != appId) revert DelegateeNotRegisteredToApp(appId, delegatee);

        as_.appIdToApp[appId].delegatees.remove(delegatee);
        as_.delegateeAddressToAppId[delegatee] = 0;
    }

    function _registerApp(
        string calldata name,
        string calldata description,
        string[] calldata authorizedDomains,
        string[] calldata authorizedRedirectUris,
        address[] calldata delegatees
    ) internal returns (uint256 newAppId) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        newAppId = as_.appIdCounter++;

        // Add the app to the list of registered apps
        as_.registeredApps.add(newAppId);

        // Add the app to the manager's list of apps
        as_.managerAddressToAppIds[msg.sender].add(newAppId);

        // Register the app
        VincentAppStorage.App storage app = as_.appIdToApp[newAppId];
        app.manager = msg.sender;
        app.name = name;
        app.description = description;

        for (uint256 i = 0; i < authorizedDomains.length; i++) {
            _addAuthorizedDomain(newAppId, authorizedDomains[i]);
        }

        for (uint256 i = 0; i < authorizedRedirectUris.length; i++) {
            _addAuthorizedRedirectUri(newAppId, authorizedRedirectUris[i]);
        }

        // Add the delegatees to the app
        for (uint256 i = 0; i < delegatees.length; i++) {
            if (as_.delegateeAddressToAppId[delegatees[i]] != 0) {
                revert DelegateeAlreadyRegisteredToApp(newAppId, delegatees[i]);
            }

            app.delegatees.add(delegatees[i]);
            as_.delegateeAddressToAppId[delegatees[i]] = newAppId;
        }
    }

    function _registerNextAppVersion(
        uint256 appId,
        string[] calldata toolIpfsCids,
        string[][] calldata toolPolicies,
        string[][][] calldata toolPolicyParameterNames
    ) internal returns (uint256 newAppVersion) {
        uint256 toolCount = toolIpfsCids.length;
        if (toolCount != toolPolicies.length || toolCount != toolPolicyParameterNames.length) {
            revert ToolsAndPoliciesLengthMismatch();
        }

        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        VincentAppStorage.App storage app = as_.appIdToApp[appId];

        // Add the app version to the app
        app.versionedApps.push();
        newAppVersion = app.versionedApps.length;

        // App versions start at 1, but the appVersions array is 0-indexed
        VincentAppStorage.VersionedApp storage versionedApp = app.versionedApps[newAppVersion - 1];
        versionedApp.version = newAppVersion;
        versionedApp.enabled = true;

        VincentAppToolPolicyStorage.AppToolPolicyStorage storage atps_ =
            VincentAppToolPolicyStorage.appToolPolicyStorage();

        // Register the tools for the app version
        for (uint256 i = 0; i < toolCount;) {
            string memory toolIpfsCid = toolIpfsCids[i]; // Load into memory
            bytes32 hashedToolCid = keccak256(abi.encodePacked(toolIpfsCid));

            if (!versionedApp.toolIpfsCidHashes.contains(hashedToolCid)) {
                versionedApp.toolIpfsCidHashes.add(hashedToolCid);
                IVincentToolFacet(address(this)).registerTool(toolIpfsCid);
            }

            VincentAppToolPolicyStorage.VersionedToolPolicies storage versionedToolPolicies =
                atps_.appIdToVersionedToolPolicies[appId][newAppVersion][hashedToolCid];

            uint256 policyCount = toolPolicies[i].length;
            for (uint256 j = 0; j < policyCount;) {
                string memory policyIpfsCid = toolPolicies[i][j]; // Load into memory
                bytes32 hashedToolPolicy = keccak256(abi.encodePacked(policyIpfsCid));

                versionedToolPolicies.policyIpfsCidHashes.add(hashedToolPolicy);

                if (bytes(atps_.policyIpfsCidHashToIpfsCid[hashedToolPolicy]).length == 0) {
                    atps_.policyIpfsCidHashToIpfsCid[hashedToolPolicy] = policyIpfsCid;
                }

                EnumerableSet.Bytes32Set storage policyParameterNameHashes =
                    versionedToolPolicies.policyIpfsCidHashToParameterNameHashes[hashedToolPolicy];

                uint256 paramCount = toolPolicyParameterNames[i][j].length;
                for (uint256 k = 0; k < paramCount;) {
                    string memory paramName = toolPolicyParameterNames[i][j][k]; // Load into memory
                    bytes32 hashedPolicyParameterName = keccak256(abi.encodePacked(paramName));

                    policyParameterNameHashes.add(hashedPolicyParameterName);

                    if (bytes(atps_.policyParameterNameHashToName[hashedPolicyParameterName]).length == 0) {
                        atps_.policyParameterNameHashToName[hashedPolicyParameterName] = paramName;
                    }
                    unchecked {
                        ++k;
                    }
                }
                unchecked {
                    ++j;
                }
            }
            unchecked {
                ++i;
            }
        }
    }

    function _addAuthorizedDomain(uint256 appId, string calldata domain) internal {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        bytes32 hashedDomain = keccak256(abi.encodePacked(domain));

        as_.appIdToApp[appId].authorizedDomains.add(hashedDomain);
        as_.authorizedDomainHashToDomain[hashedDomain] = domain;

        emit AuthorizedDomainAdded(appId, domain);
    }

    function _addAuthorizedRedirectUri(uint256 appId, string calldata redirectUri) internal {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        bytes32 hashedRedirectUri = keccak256(abi.encodePacked(redirectUri));

        as_.appIdToApp[appId].authorizedRedirectUris.add(hashedRedirectUri);
        as_.authorizedRedirectUriHashToRedirectUri[hashedRedirectUri] = redirectUri;

        emit AuthorizedRedirectUriAdded(appId, redirectUri);
    }
}
