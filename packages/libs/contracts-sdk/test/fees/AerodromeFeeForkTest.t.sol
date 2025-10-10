// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "forge-std/Test.sol";
import "forge-std/console.sol";

import {DeployFeeDiamond} from "../../script/DeployFeeDiamond.sol";

import {Fee} from "../../contracts/fees/Fee.sol";
import {FeeViewsFacet} from "../../contracts/fees/facets/FeeViewsFacet.sol";
import {FeeAdminFacet} from "../../contracts/fees/facets/FeeAdminFacet.sol";
import {AerodromeSwapFeeFacet} from "../../contracts/fees/facets/AerodromeSwapFeeFacet.sol";
import {LibFeeStorage} from "../../contracts/fees/LibFeeStorage.sol";
import {FeeUtils} from "../../contracts/fees/FeeUtils.sol";
import {OwnershipFacet} from "../../contracts/diamond-base/facets/OwnershipFacet.sol";

import {USDC} from "../ABIs/USDC.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IRouter} from "@aerodrome/contracts/interfaces/IRouter.sol";

contract FeeForkTest is Test {
    address owner;
    address APP_USER_ALICE = makeAddr("Alice");
    // real aerodrome router on base from https://www.aerodrome.finance/security
    address REAL_AERODROME_ROUTER = 0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43;
    // real USDC address on base
    address REAL_USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    // real USDC master_minter
    address REAL_USDC_MASTER_MINTER;
    address USDC_MINTER = makeAddr("USDCMinter");
    // real WETH address on base
    address REAL_WETH = 0x4200000000000000000000000000000000000006;

    Fee public feeDiamond;
    FeeViewsFacet public feeViewsFacet;
    FeeAdminFacet public feeAdminFacet;
    AerodromeSwapFeeFacet public aerodromeSwapFeeFacet;
    OwnershipFacet public ownershipFacet;

    USDC public USDCErc20;
    ERC20 public WETHErc20;
    IRouter public aerodromeRouter;
    uint256 public erc20Decimals;

    function setUp() public {
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        vm.setEnv("VINCENT_DEPLOYER_PRIVATE_KEY", vm.toString(deployerPrivateKey));
        owner = vm.addr(deployerPrivateKey);

        DeployFeeDiamond deployScript = new DeployFeeDiamond();

        address diamondAddress = deployScript.deployToNetwork("test", keccak256("testSalt"));
        feeDiamond = Fee(payable(diamondAddress));

        feeViewsFacet = FeeViewsFacet(diamondAddress);
        feeAdminFacet = FeeAdminFacet(diamondAddress);
        aerodromeSwapFeeFacet = AerodromeSwapFeeFacet(diamondAddress);
        ownershipFacet = OwnershipFacet(diamondAddress);

        // set the aave pool address in the fee diamond
        vm.startPrank(owner);
        feeAdminFacet.setAerodromeRouter(REAL_AERODROME_ROUTER);
        vm.stopPrank();

        // set up the real aave pool and USDC token
        aerodromeRouter = IRouter(REAL_AERODROME_ROUTER);
        USDCErc20 = USDC(REAL_USDC);
        WETHErc20 = ERC20(REAL_WETH);
        REAL_USDC_MASTER_MINTER = USDCErc20.masterMinter();
        // configure the USDC minter
        vm.prank(REAL_USDC_MASTER_MINTER);
        USDCErc20.configureMinter(USDC_MINTER, type(uint256).max);
        vm.stopPrank();
        erc20Decimals = USDCErc20.decimals();
        console.log("setUp complete");
    }

    function testSingleRouteSwap() public {
        uint256 swapAmount = 50 * 10 ** erc20Decimals;

        // mint the USDC to the user
        vm.startPrank(USDC_MINTER);
        USDCErc20.mint(APP_USER_ALICE, swapAmount);
        vm.stopPrank();
        console.log("minted USDC to user");

        vm.startPrank(APP_USER_ALICE);
        USDCErc20.approve(address(aerodromeSwapFeeFacet), swapAmount);
        console.log("approved USDC to our fee contract");
        // create the route
        IRouter.Route[] memory routes = new IRouter.Route[](1);
        routes[0] = IRouter.Route(address(REAL_USDC), address(REAL_WETH), false, address(0));

        // reduce the expected output by 0.5% for slippage
        uint256 expectedOutput = (aerodromeRouter.getAmountsOut(swapAmount, routes)[1] * 9950) / 10000;

        uint256 userWethBalanceBefore = WETHErc20.balanceOf(APP_USER_ALICE);

        aerodromeSwapFeeFacet.swapExactTokensForTokensOnAerodrome(
            swapAmount, expectedOutput, routes, APP_USER_ALICE, block.timestamp + 1 minutes
        );
        vm.stopPrank();
        console.log("swapped USDC to WETH");
        uint256 userWethBalanceAfter = WETHErc20.balanceOf(APP_USER_ALICE);
        assertGt(userWethBalanceAfter - userWethBalanceBefore, expectedOutput);
        console.log("userWethBalanceAfter", userWethBalanceAfter);

        // confirm the profit went to the fee contract, and the rest of the tokens went to the user
        uint256 userBalance = USDCErc20.balanceOf(APP_USER_ALICE);
        uint256 feeContractBalance = USDCErc20.balanceOf(address(aerodromeSwapFeeFacet));
        console.log("usdc userBalance", userBalance);
        console.log("usdc feeContractBalance", feeContractBalance);

        // uint256 expectedTotalProfit = expectedTotalWithdrawal - depositAmount;
        // uint256 expectedUserProfit = expectedTotalProfit - (expectedTotalProfit * performanceFeePercentage / 10000);
        // uint256 expectedFeeContractProfit = expectedTotalProfit * performanceFeePercentage / 10000;
        // console.log("expectedTotalProfit", expectedTotalProfit);
        // console.log("expectedUserProfit", expectedUserProfit);
        // console.log("expectedFeeContractProfit", expectedFeeContractProfit);
        // console.log("userProfit", userBalance);
        // console.log("feeContractProfit", feeContractBalance);

        // assertEq(userBalance, depositAmount + expectedUserProfit);
        // assertEq(feeContractBalance, expectedFeeContractProfit);

        // test that USDC is in the set of tokens that have collected fees
        address[] memory tokensWithCollectedFees = feeAdminFacet.tokensWithCollectedFees();
        assertEq(tokensWithCollectedFees.length, 1);
        assertEq(tokensWithCollectedFees[0], address(USDCErc20));

        // test withdrawal of profit from the fee contract as owner
        vm.startPrank(owner);
        feeAdminFacet.withdrawTokens(address(USDCErc20));
        vm.stopPrank();

        // confirm the profit went to the owner
        // assertEq(USDCErc20.balanceOf(owner), expectedFeeContractProfit);

        // confirm that the token is no longer in the set of tokens that have collected fees
        tokensWithCollectedFees = feeAdminFacet.tokensWithCollectedFees();
        assertEq(tokensWithCollectedFees.length, 0);
    }
}
