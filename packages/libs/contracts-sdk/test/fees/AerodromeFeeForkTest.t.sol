// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.29;

// import "forge-std/Test.sol";
// import "forge-std/console.sol";

// import {DeployFeeDiamond} from "../../script/DeployFeeDiamond.sol";

// import {Fee} from "../../contracts/fees/Fee.sol";
// import {FeeViewsFacet} from "../../contracts/fees/facets/FeeViewsFacet.sol";
// import {FeeAdminFacet} from "../../contracts/fees/facets/FeeAdminFacet.sol";
// import {AerodromeSwapFeeFacet} from "../../contracts/fees/facets/AerodromeSwapFeeFacet.sol";
// import {LibFeeStorage} from "../../contracts/fees/LibFeeStorage.sol";
// import {FeeUtils} from "../../contracts/fees/FeeUtils.sol";
// import {FeeTestCommon} from "./FeeTestCommon.sol";
// import {USDC} from "../ABIs/USDC.sol";
// import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import {IRouter} from "@aerodrome/contracts/interfaces/IRouter.sol";

// contract AerodromeFeeForkTest is FeeTestCommon {
//     uint256 constant BASIS_POINT_DIVISOR = 10000;

//     address owner;
//     uint40 DEV_APP_ID = uint40(vm.randomUint(1, type(uint40).max));
//     address APP_MANAGER_BOB = makeAddr("Bob");
//     address APP_DELEGATEE_BOB = makeAddr("BobDelegatee");
//     address APP_USER_ALICE = makeAddr("Alice");
//     // real aerodrome router on base from https://www.aerodrome.finance/security
//     address REAL_AERODROME_ROUTER = 0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43;
//     // real USDC address on base
//     address REAL_USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
//     // real USDC master_minter
//     address REAL_USDC_MASTER_MINTER;
//     address USDC_MINTER = makeAddr("USDCMinter");
//     // real WETH address on base
//     address REAL_WETH = 0x4200000000000000000000000000000000000006;

//     FeeViewsFacet public feeViewsFacet;
//     FeeAdminFacet public feeAdminFacet;
//     AerodromeSwapFeeFacet public aerodromeSwapFeeFacet;

//     USDC public USDCErc20;
//     ERC20 public WETHErc20;
//     IRouter public aerodromeRouter;
//     uint256 public erc20Decimals;

//     function setUp() public {
//         uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
//         vm.setEnv("VINCENT_DEPLOYER_PRIVATE_KEY", vm.toString(deployerPrivateKey));
//         owner = vm.addr(deployerPrivateKey);

//         address diamondAddress = _deployFeeDiamond();

//         feeViewsFacet = FeeViewsFacet(diamondAddress);
//         feeAdminFacet = FeeAdminFacet(diamondAddress);
//         aerodromeSwapFeeFacet = AerodromeSwapFeeFacet(diamondAddress);

//         // set the aerodrome router address in the fee diamond
//         vm.startPrank(owner);
//         feeAdminFacet.setAerodromeRouter(REAL_AERODROME_ROUTER);
//         vm.stopPrank();

//         // set up the real aerodrome router and USDC token
//         aerodromeRouter = IRouter(REAL_AERODROME_ROUTER);
//         USDCErc20 = USDC(REAL_USDC);
//         WETHErc20 = ERC20(REAL_WETH);
//         REAL_USDC_MASTER_MINTER = USDCErc20.masterMinter();
//         // configure the USDC minter
//         vm.prank(REAL_USDC_MASTER_MINTER);
//         USDCErc20.configureMinter(USDC_MINTER, type(uint256).max);
//         vm.stopPrank();
//         erc20Decimals = USDCErc20.decimals();

//         address vincentDiamondAddress = _deployVincentDiamondAndBasicApp(APP_MANAGER_BOB, APP_DELEGATEE_BOB, DEV_APP_ID);

//         // set the vincent app contract address in the fee diamond
//         vm.startPrank(owner);
//         feeAdminFacet.setVincentAppDiamond(vincentDiamondAddress);
//         vm.stopPrank();
//     }

//     function testSingleRouteSingleSwap() public {
//         uint256 swapAmount = 50 * 10 ** erc20Decimals;

//         uint256 swapFeePercentage = feeAdminFacet.swapFeePercentage();

//         // mint the USDC to the user
//         vm.startPrank(USDC_MINTER);
//         USDCErc20.mint(APP_USER_ALICE, swapAmount);
//         vm.stopPrank();
//         console.log("minted USDC to user");

//         vm.startPrank(APP_USER_ALICE);
//         USDCErc20.approve(address(aerodromeSwapFeeFacet), swapAmount);
//         console.log("approved USDC to our fee contract");
//         // create the route
//         IRouter.Route[] memory routes = new IRouter.Route[](1);
//         routes[0] = IRouter.Route(address(REAL_USDC), address(REAL_WETH), false, address(0));

//         // reduce the expected output by 0.5% for slippage
//         uint256 expectedOutput = (aerodromeRouter.getAmountsOut(swapAmount, routes)[1] * 9950) / 10000;

//         uint256 userWethBalanceBefore = WETHErc20.balanceOf(APP_USER_ALICE);

//         aerodromeSwapFeeFacet.swapExactTokensForTokensOnAerodrome(
//             DEV_APP_ID, swapAmount, expectedOutput, routes, APP_USER_ALICE, block.timestamp + 1 minutes
//         );
//         vm.stopPrank();
//         console.log("swapped USDC to WETH");
//         uint256 userWethBalanceAfter = WETHErc20.balanceOf(APP_USER_ALICE);
//         // assert that they got at least the amountOut
//         assertGt(userWethBalanceAfter - userWethBalanceBefore, expectedOutput);
//         console.log("userWethBalanceAfter", userWethBalanceAfter);

//         // confirm the profit went to the fee contract, and the rest of the tokens went to the user
//         uint256 userBalance = USDCErc20.balanceOf(APP_USER_ALICE);
//         uint256 feeContractBalance = USDCErc20.balanceOf(address(aerodromeSwapFeeFacet));
//         console.log("usdc userBalance", userBalance);
//         console.log("usdc feeContractBalance", feeContractBalance);

//         // the user swapped all their USDC to WETH, so their balance should be 0
//         assertEq(userBalance, 0);

//         uint256 expectedFee = swapAmount * swapFeePercentage / BASIS_POINT_DIVISOR;
//         assertEq(feeContractBalance, expectedFee);

//         // test that USDC is in the set of tokens that have collected fees for the app
//         address[] memory tokensWithCollectedFees = feeAdminFacet.tokensWithCollectedFees(DEV_APP_ID);
//         assertEq(tokensWithCollectedFees.length, 1);
//         assertEq(tokensWithCollectedFees[0], address(USDCErc20));

//         // test that USDC is in the set of tokens that have collected fees for the foundation
//         tokensWithCollectedFees = feeAdminFacet.tokensWithCollectedFees(LibFeeStorage.LIT_FOUNDATION_APP_ID);
//         assertEq(tokensWithCollectedFees.length, 1);
//         assertEq(tokensWithCollectedFees[0], address(USDCErc20));

//         // check the collected fees for the foundation
//         uint256 litCollectedAppFees =
//             feeViewsFacet.collectedAppFees(LibFeeStorage.LIT_FOUNDATION_APP_ID, address(USDCErc20));
//         // check the collected fees for the app
//         uint256 appCollectedAppFees = feeViewsFacet.collectedAppFees(DEV_APP_ID, address(USDCErc20));
//         assertEq(litCollectedAppFees + appCollectedAppFees, expectedFee);

//         // calculate the split expected for the lit foundation, and for the app
//         uint256 expectedLitCollectedAppFees =
//             expectedFee * feeAdminFacet.litAppFeeSplitPercentage() / BASIS_POINT_DIVISOR;
//         uint256 expectedAppCollectedAppFees = expectedFee - expectedLitCollectedAppFees;
//         assertEq(litCollectedAppFees, expectedLitCollectedAppFees);
//         assertEq(appCollectedAppFees, expectedAppCollectedAppFees);

//         // test withdrawal of profit from the fee contract as owner
//         vm.startPrank(owner);
//         feeAdminFacet.withdrawAppFees(LibFeeStorage.LIT_FOUNDATION_APP_ID, address(USDCErc20));
//         vm.stopPrank();

//         // confirm the profit went to the owner
//         assertEq(USDCErc20.balanceOf(owner), expectedLitCollectedAppFees);

//         // confirm that the token is no longer in the set of tokens that have collected fees
//         tokensWithCollectedFees = feeAdminFacet.tokensWithCollectedFees(LibFeeStorage.LIT_FOUNDATION_APP_ID);
//         assertEq(tokensWithCollectedFees.length, 0);

//         // test withdrawal of profit from the fee contract as app manager
//         vm.startPrank(APP_MANAGER_BOB);
//         feeAdminFacet.withdrawAppFees(DEV_APP_ID, address(USDCErc20));
//         vm.stopPrank();

//         // confirm the profit went to the app manager
//         assertEq(USDCErc20.balanceOf(APP_MANAGER_BOB), expectedAppCollectedAppFees);

//         // confirm that the token is no longer in the set of tokens that have collected fees
//         tokensWithCollectedFees = feeAdminFacet.tokensWithCollectedFees(DEV_APP_ID);
//         assertEq(tokensWithCollectedFees.length, 0);
//     }

//     function testSingleRouteMultipleSwaps() public {
//         uint256 swapAmount = 50 * 10 ** erc20Decimals;

//         uint256 swapFeePercentage = feeAdminFacet.swapFeePercentage();

//         // mint the USDC to the user
//         vm.startPrank(USDC_MINTER);
//         USDCErc20.mint(APP_USER_ALICE, swapAmount);
//         vm.stopPrank();
//         console.log("minted USDC to user");

//         vm.startPrank(APP_USER_ALICE);
//         USDCErc20.approve(address(aerodromeSwapFeeFacet), swapAmount);
//         console.log("approved USDC to our fee contract");
//         // create the route
//         IRouter.Route[] memory routes = new IRouter.Route[](1);
//         routes[0] = IRouter.Route(address(REAL_USDC), address(REAL_WETH), false, address(0));

//         // reduce the expected output by 0.5% for slippage
//         uint256 expectedOutput = (aerodromeRouter.getAmountsOut(swapAmount, routes)[1] * 9950) / 10000;

//         uint256 userWethBalanceBefore = WETHErc20.balanceOf(APP_USER_ALICE);

//         // first swap
//         aerodromeSwapFeeFacet.swapExactTokensForTokensOnAerodrome(
//             DEV_APP_ID, swapAmount, expectedOutput, routes, APP_USER_ALICE, block.timestamp + 1 minutes
//         );
//         vm.stopPrank();
//         console.log("swapped USDC to WETH");
//         uint256 userWethBalanceAfter = WETHErc20.balanceOf(APP_USER_ALICE);
//         // assert that they got at least the amountOut
//         assertGt(userWethBalanceAfter - userWethBalanceBefore, expectedOutput);
//         console.log("userWethBalanceAfter", userWethBalanceAfter);

//         // confirm the profit went to the fee contract, and the rest of the tokens went to the user
//         uint256 userBalance = USDCErc20.balanceOf(APP_USER_ALICE);
//         uint256 feeContractBalance = USDCErc20.balanceOf(address(aerodromeSwapFeeFacet));
//         console.log("usdc userBalance", userBalance);
//         console.log("usdc feeContractBalance", feeContractBalance);

//         // the user swapped all their USDC to WETH, so their balance should be 0
//         assertEq(userBalance, 0);

//         uint256 expectedFee = swapAmount * swapFeePercentage / BASIS_POINT_DIVISOR;
//         assertEq(feeContractBalance, expectedFee);

//         // let's do another swap before withdrawing the fee
//         // mint more USDC to the user
//         vm.startPrank(USDC_MINTER);
//         USDCErc20.mint(APP_USER_ALICE, swapAmount);
//         vm.stopPrank();
//         console.log("minted USDC to user");

//         // approve the fee contract to spend the USDC
//         vm.startPrank(APP_USER_ALICE);
//         USDCErc20.approve(address(aerodromeSwapFeeFacet), swapAmount);
//         console.log("approved USDC to our fee contract again");

//         // reduce the expected output by 0.5% for slippage
//         expectedOutput = (aerodromeRouter.getAmountsOut(swapAmount, routes)[1] * 9950) / 10000;

//         userWethBalanceBefore = WETHErc20.balanceOf(APP_USER_ALICE);

//         aerodromeSwapFeeFacet.swapExactTokensForTokensOnAerodrome(
//             DEV_APP_ID, swapAmount, expectedOutput, routes, APP_USER_ALICE, block.timestamp + 1 minutes
//         );
//         vm.stopPrank();
//         console.log("swapped USDC to WETH again");
//         userWethBalanceAfter = WETHErc20.balanceOf(APP_USER_ALICE);
//         // assert that they got at least the amountOut
//         assertGt(userWethBalanceAfter - userWethBalanceBefore, expectedOutput);
//         console.log("userWethBalanceAfter", userWethBalanceAfter);

//         // confirm the profit went to the fee contract, and the rest of the tokens went to the user
//         userBalance = USDCErc20.balanceOf(APP_USER_ALICE);
//         feeContractBalance = USDCErc20.balanceOf(address(aerodromeSwapFeeFacet));
//         console.log("usdc userBalance", userBalance);
//         console.log("usdc feeContractBalance", feeContractBalance);

//         // the user swapped all their USDC to WETH, so their balance should be 0
//         assertEq(userBalance, 0);

//         // since we swapped twice, the expected fee should be twice the original
//         expectedFee = expectedFee * 2;
//         assertEq(feeContractBalance, expectedFee);

//         // test that USDC is in the set of tokens that have collected fees for the app
//         address[] memory tokensWithCollectedFees = feeAdminFacet.tokensWithCollectedFees(DEV_APP_ID);
//         assertEq(tokensWithCollectedFees.length, 1);
//         assertEq(tokensWithCollectedFees[0], address(USDCErc20));

//         // test that USDC is in the set of tokens that have collected fees for the foundation
//         tokensWithCollectedFees = feeAdminFacet.tokensWithCollectedFees(LibFeeStorage.LIT_FOUNDATION_APP_ID);
//         assertEq(tokensWithCollectedFees.length, 1);
//         assertEq(tokensWithCollectedFees[0], address(USDCErc20));

//         // check the collected fees for the foundation
//         uint256 litCollectedAppFees =
//             feeViewsFacet.collectedAppFees(LibFeeStorage.LIT_FOUNDATION_APP_ID, address(USDCErc20));
//         // check the collected fees for the app
//         uint256 appCollectedAppFees = feeViewsFacet.collectedAppFees(DEV_APP_ID, address(USDCErc20));
//         assertEq(litCollectedAppFees + appCollectedAppFees, expectedFee);

//         // calculate the split expected for the lit foundation, and for the app
//         uint256 expectedLitCollectedAppFees =
//             expectedFee * feeAdminFacet.litAppFeeSplitPercentage() / BASIS_POINT_DIVISOR;
//         uint256 expectedAppCollectedAppFees = expectedFee - expectedLitCollectedAppFees;
//         assertEq(litCollectedAppFees, expectedLitCollectedAppFees);
//         assertEq(appCollectedAppFees, expectedAppCollectedAppFees);

//         // test withdrawal of profit from the fee contract as owner
//         vm.startPrank(owner);
//         feeAdminFacet.withdrawAppFees(LibFeeStorage.LIT_FOUNDATION_APP_ID, address(USDCErc20));
//         vm.stopPrank();

//         // confirm the profit went to the owner
//         assertEq(USDCErc20.balanceOf(owner), expectedLitCollectedAppFees);

//         // confirm that the token is no longer in the set of tokens that have collected fees
//         tokensWithCollectedFees = feeAdminFacet.tokensWithCollectedFees(LibFeeStorage.LIT_FOUNDATION_APP_ID);
//         assertEq(tokensWithCollectedFees.length, 0);

//         // test withdrawal of profit from the fee contract as app manager
//         vm.startPrank(APP_MANAGER_BOB);
//         feeAdminFacet.withdrawAppFees(DEV_APP_ID, address(USDCErc20));
//         vm.stopPrank();

//         // confirm the profit went to the app manager
//         assertEq(USDCErc20.balanceOf(APP_MANAGER_BOB), expectedAppCollectedAppFees);

//         // confirm that the token is no longer in the set of tokens that have collected fees
//         tokensWithCollectedFees = feeAdminFacet.tokensWithCollectedFees(DEV_APP_ID);
//         assertEq(tokensWithCollectedFees.length, 0);
//     }
// }
