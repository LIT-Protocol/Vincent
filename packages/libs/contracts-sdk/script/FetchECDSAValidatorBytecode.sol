// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "forge-std/Script.sol";

/**
 * @title FetchECDSAValidatorBytecode
 * @notice Script to fetch the ECDSA validator bytecode from Base Mainnet and save it
 * @dev Run with: forge script script/FetchECDSAValidatorBytecode.sol:FetchECDSAValidatorBytecode --rpc-url https://mainnet.base.org
 */
contract FetchECDSAValidatorBytecode is Script {
    // ZeroDev ECDSA Validator canonical address
    address constant ECDSA_VALIDATOR_ADDRESS = 0x845ADb2C711129d4f3966735eD98a9F09fC4cE57;

    function run() external {
        // Get the bytecode from the deployed contract on Base Mainnet
        bytes memory code = ECDSA_VALIDATOR_ADDRESS.code;

        console.log("ECDSA Validator address:", ECDSA_VALIDATOR_ADDRESS);
        console.log("Bytecode length:", code.length);

        // Write bytecode to file
        string memory bytecodeHex = vm.toString(code);
        vm.writeFile("test/fixtures/ECDSAValidatorBytecode.txt", bytecodeHex);

        console.log("Bytecode saved to test/fixtures/ECDSAValidatorBytecode.txt");
    }
}
