// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "../LibFeeStorage.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {IRouter} from "@aerodrome/contracts/interfaces/IRouter.sol";

/**
 * @title AerodromeSwapFeeFacet
 * @notice A facet of the Fee Diamond that manages Aerodrome swap fees
 */
contract AerodromeSwapFeeFacet {
    using EnumerableSet for EnumerableSet.AddressSet;

    function swapExactTokensForTokensOnAerodrome(
        uint256 amountIn,
        uint256 amountOutMin,
        IRouter.Route[] calldata routes,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        // first, transfer the amountIn to this contract
        IERC20(routes[0].from).transferFrom(msg.sender, address(this), amountIn);

        // calculate the fee from amountIn
        uint256 fee = amountIn * LibFeeStorage.getStorage().swapFeePercentage / 10000;
        // subtract the fee from amountIn
        amountIn -= fee;

        // reduce amountOutMin by the same percentage since we're taking
        // the fee from the amountIn and amountOutMin depends on it
        amountOutMin -= amountOutMin * LibFeeStorage.getStorage().swapFeePercentage / 10000;

        // approve the router to spend the amountIn
        IERC20(routes[0].from).approve(LibFeeStorage.getStorage().aerodromeRouter, amountIn);

        // swap the tokens
        amounts = IRouter(LibFeeStorage.getStorage().aerodromeRouter)
            .swapExactTokensForTokens(amountIn, amountOutMin, routes, address(this), deadline);

        // add the input token to the collected fees list
        LibFeeStorage.getStorage().tokensWithCollectedFees.add(routes[0].from);

        // transfer the tokens to the recipient
        IERC20(routes[routes.length - 1].to).transfer(to, amounts[amounts.length - 1]);

        // return the amounts just like aerodrome
        return amounts;
    }
}
