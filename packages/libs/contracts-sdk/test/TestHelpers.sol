// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "forge-std/Test.sol";

/**
 * @title TestHelpers
 * @notice Helper functions for setting up test environments
 */
contract TestHelpers is Test {
    // ZeroDev ECDSA Validator canonical address (same across all networks)
    address internal constant ECDSA_VALIDATOR_ADDRESS = 0x845ADb2C711129d4f3966735eD98a9F09fC4cE57;

    /**
     * @notice Deploy the ECDSA validator at the canonical address using vm.etch
     * @dev This loads the bytecode from the fixtures file and deploys it at the expected address
     *      Run script/FetchECDSAValidatorBytecode.sol first to generate the bytecode file
     */
    function setupECDSAValidator() internal {
        // Read the bytecode from the fixture file
        string memory bytecodeHex = vm.readFile("test/fixtures/ECDSAValidatorBytecode.txt");
        bytes memory code = vm.parseBytes(bytecodeHex);

        // Deploy the bytecode at the canonical address in our test environment
        vm.etch(ECDSA_VALIDATOR_ADDRESS, code);
    }

    /**
     * @notice Register an EOA owner for a smart account in the ECDSA validator
     * @param smartAccount The smart account (agent) address
     * @param owner The EOA owner address who can call onlySmartAccountOwner functions
     * @dev Uses vm.store to directly set the storage mapping value in the ECDSA validator
     *      This simulates the smart account having been deployed with this owner
     *
     *      The ECDSA validator has: mapping(address => address) public ecdsaValidatorStorage;
     *      This mapping is at slot 0, so we calculate: keccak256(abi.encode(smartAccount, 0))
     */
    function registerSmartAccountOwner(address smartAccount, address owner) internal {
        // Calculate the storage slot for ecdsaValidatorStorage[smartAccount]
        // mapping(address => address) public ecdsaValidatorStorage; // slot 0
        bytes32 slot = keccak256(abi.encode(smartAccount, uint256(0)));

        // Set the owner in storage at the ECDSA validator address
        vm.store(ECDSA_VALIDATOR_ADDRESS, slot, bytes32(uint256(uint160(owner))));
    }
}
