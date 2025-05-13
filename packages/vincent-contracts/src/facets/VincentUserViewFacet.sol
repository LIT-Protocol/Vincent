// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "../LibVincentDiamondStorage.sol";
import "../VincentBase.sol";

contract VincentUserViewFacet is VincentBase {
    using VincentUserStorage for VincentUserStorage.UserStorage;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    struct PermittedApp {
        uint256 appId;
        uint256 appVersion;
    }

    struct PermittedToolsAndPolicies {
        uint256 appId;
        uint256 appVersion;
        ToolWithPolicies[] tools;
    }

    struct ToolWithPolicies {
        string toolIpfsCid;
        Policy[] policies;
    }

    struct Policy {
        string policyIpfsCid;
        bytes policyParameterValues;
    }

    struct DelegateePermission {
        bool isPermitted;
        uint256 appId;
        uint256 appVersion;
    }

    error AppNotPermittedByPkp(uint256 appId);
    error DelegateeNotAssociatedWithApp(address delegatee);
    error AppNotEnabled(uint256 appId);
    error ToolNotPermittedByAppVersion(uint256 appId, uint256 appVersion, string toolIpfsCid);

    function getRegisteredPkpsForAddress(address userAddress) external view returns (uint256[] memory) {
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        return us_.userAddressToRegisteredAgentPkps[userAddress].values();
    }

    function getPermittedAppVersionForPkp(uint256 appId, uint256 pkpTokenId)
        public
        view
        appNotDeleted(appId)
        returns (uint256)
    {
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        uint256 permittedAppVersion = us_.agentPkpTokenIdToAgentStorage[pkpTokenId].permittedAppVersion[appId];
        if (permittedAppVersion == 0) {
            revert AppNotPermittedByPkp(appId);
        }
        return permittedAppVersion;
    }

    function getPermittedAppsForPkp(uint256 pkpTokenId) external view returns (PermittedApp[] memory permittedApps) {
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        uint256[] memory allPermittedAppIds = us_.agentPkpTokenIdToAgentStorage[pkpTokenId].permittedApps.values();

        // Create a temporary array to store the results
        PermittedApp[] memory tempPermittedApps = new PermittedApp[](allPermittedAppIds.length);
        uint256 nonDeletedCount = 0;

        VincentUserStorage.AgentStorage storage agentStorage = us_.agentPkpTokenIdToAgentStorage[pkpTokenId];
        for (uint256 i = 0; i < allPermittedAppIds.length; i++) {
            if (!as_.appIdToApp[allPermittedAppIds[i]].isDeleted) {
                tempPermittedApps[nonDeletedCount] = PermittedApp({
                    appId: allPermittedAppIds[i],
                    appVersion: agentStorage.permittedAppVersion[allPermittedAppIds[i]]
                });
                nonDeletedCount++;
            }
        }

        // Create the final array with the correct size
        permittedApps = new PermittedApp[](nonDeletedCount);

        // Copy the elements to the final array
        for (uint256 i = 0; i < nonDeletedCount; i++) {
            permittedApps[i] = tempPermittedApps[i];
        }

        return permittedApps;
    }

    function getPermittedToolsAndPoliciesForApp(uint256 appId, uint256 pkpTokenId)
        external
        view
        returns (ToolWithPolicies[] memory)
    {
        // getPermittedAppVersionForPkp checks if app is deleted
        uint256 permittedAppVersion = getPermittedAppVersionForPkp(appId, pkpTokenId);

        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        VincentAppStorage.AppVersion storage appVersion =
            as_.appIdToApp[appId].appVersions[getAppVersionIndex(permittedAppVersion)];

        bytes32[] memory toolIpfsCidHashes = appVersion.toolIpfsCidHashes.values();
        ToolWithPolicies[] memory toolWithPolicies = new ToolWithPolicies[](toolIpfsCidHashes.length);

        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        VincentLitActionStorage.LitActionStorage storage ls_ = VincentLitActionStorage.litActionStorage();

        for (uint256 i = 0; i < toolIpfsCidHashes.length; i++) {
            toolWithPolicies[i] = ToolWithPolicies({
                toolIpfsCid: ls_.ipfsCidHashToIpfsCid[toolIpfsCidHashes[i]],
                policies: _getPoliciesForTool(appId, permittedAppVersion, toolIpfsCidHashes[i], pkpTokenId, us_, ls_)
            });
        }

        return toolWithPolicies;
    }

    function isDelegateePermittedToExecuteToolUsingPkp(
        address delegatee,
        uint256 pkpTokenId,
        string calldata toolIpfsCid
    ) public view returns (DelegateePermission memory) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        uint256 appIdDelegateeBelongsTo = as_.delegateeAddressToAppId[delegatee];
        if (appIdDelegateeBelongsTo == 0) {
            revert DelegateeNotAssociatedWithApp(delegatee);
        }

        // getPermittedAppVersionForPkp checks if app is deleted
        uint256 permittedAppVersion = getPermittedAppVersionForPkp(appIdDelegateeBelongsTo, pkpTokenId);

        VincentAppStorage.AppVersion storage appVersion =
            as_.appIdToApp[appIdDelegateeBelongsTo].appVersions[getAppVersionIndex(permittedAppVersion)];

        if (!appVersion.enabled) {
            revert AppNotEnabled(appIdDelegateeBelongsTo);
        }

        if (!appVersion.toolIpfsCidHashes.contains(keccak256(abi.encodePacked(toolIpfsCid)))) {
            revert ToolNotPermittedByAppVersion(appIdDelegateeBelongsTo, permittedAppVersion, toolIpfsCid);
        }

        return DelegateePermission({isPermitted: true, appId: appIdDelegateeBelongsTo, appVersion: permittedAppVersion});
    }

    function getRegisteredPoliciesForTool(uint256 appId, uint256 pkpTokenId, string calldata toolIpfsCid)
        public
        view
        returns (Policy[] memory)
    {
        uint256 permittedAppVersion = getPermittedAppVersionForPkp(appId, pkpTokenId);

        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        VincentLitActionStorage.LitActionStorage storage ls_ = VincentLitActionStorage.litActionStorage();

        return _getPoliciesForTool(
            appId, permittedAppVersion, keccak256(abi.encodePacked(toolIpfsCid)), pkpTokenId, us_, ls_
        );
    }

    function checkIsPermittedAndGetRegisteredPoliciesForTool(
        address delegatee,
        uint256 pkpTokenId,
        string calldata toolIpfsCid
    ) external view returns (DelegateePermission memory delegateePermission, Policy[] memory policies) {
        delegateePermission =
            isDelegateePermittedToExecuteToolUsingPkp(delegatee, pkpTokenId, toolIpfsCid);
        return (
            delegateePermission,
            getRegisteredPoliciesForTool(delegateePermission.appId, pkpTokenId, toolIpfsCid)
        );
    }

    function getToolPolicyParameterValuesForPkp(
        address delegatee,
        uint256 pkpTokenId,
        string calldata toolIpfsCid,
        string calldata policyIpfsCid
    ) external view returns (DelegateePermission memory delegateePermission, bytes memory policyParameterValues) {
        delegateePermission =
            isDelegateePermittedToExecuteToolUsingPkp(delegatee, pkpTokenId, toolIpfsCid);

        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        VincentUserStorage.ToolPolicyStorage storage toolPolicyStorage = us_.agentPkpTokenIdToAgentStorage[pkpTokenId].toolPolicyStorage[delegateePermission
            .appId][delegateePermission.appVersion][keccak256(abi.encodePacked(toolIpfsCid))];

        return (
            delegateePermission,
            toolPolicyStorage.policyIpfsCidHashToParameterValues[keccak256(abi.encodePacked(policyIpfsCid))]
        );
    }

    function _getPoliciesForTool(
        uint256 appId,
        uint256 appVersion,
        bytes32 toolIpfsCidHash,
        uint256 pkpTokenId,
        VincentUserStorage.UserStorage storage us_,
        VincentLitActionStorage.LitActionStorage storage ls_
    ) internal view returns (Policy[] memory) {
        VincentUserStorage.ToolPolicyStorage storage toolPolicyStorage =
            us_.agentPkpTokenIdToAgentStorage[pkpTokenId].toolPolicyStorage[appId][appVersion][toolIpfsCidHash];

        bytes32[] memory policyHashes = toolPolicyStorage.policyIpfsCidHashesWithParameters.values();
        Policy[] memory policies = new Policy[](policyHashes.length);

        for (uint256 i = 0; i < policyHashes.length; i++) {
            policies[i] = Policy({
                policyIpfsCid: ls_.ipfsCidHashToIpfsCid[policyHashes[i]],
                policyParameterValues: toolPolicyStorage.policyIpfsCidHashToParameterValues[policyHashes[i]]
            });
        }
        return policies;
    }
}
