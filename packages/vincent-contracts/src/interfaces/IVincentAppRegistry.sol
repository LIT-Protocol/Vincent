// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IVincentAppRegistry
 * @notice Interface for Vincent App Registry contract
 */
interface IVincentAppRegistry {
    /**
     * @notice Check if an address is a delegatee for an app
     * @param appManager The app management wallet address
     * @param delegatee The delegatee address to check
     * @return bool True if the address is a delegatee
     */
    function isDelegatee(address appManager, address delegatee) external view returns (bool);

    /**
     * @notice Check if an app is permitted to use an agent PKP
     * @param appManager The app management wallet address
     * @param agentPkpTokenId The agent PKP token ID
     * @return bool True if the app is permitted to use the PKP
     */
    function isAppPermittedForAgentPkp(address appManager, uint256 agentPkpTokenId) external view returns (bool);
}
