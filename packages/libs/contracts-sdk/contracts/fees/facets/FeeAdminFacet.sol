// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "../LibFeeStorage.sol";
import {LibDiamond} from "../../diamond-base/libraries/LibDiamond.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {FeeUtils} from "../FeeUtils.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {VincentAppViewFacet} from "../../facets/VincentAppViewFacet.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title FeeAdminFacet
 * @notice A facet of the Fee Diamond that a Vincent admin can use to withdraw collected fees
 */
contract FeeAdminFacet {
    using EnumerableSet for EnumerableSet.AddressSet;
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    struct OwnerAttestation {
        uint256 srcChainId;        // typically Chronicle chain Id
        address srcContract;       // typically the VincentAppDiamond contract
        address owner;             // owner address from the L3
        uint256 appId;             // the Vincent appId that this user is an owner of
        uint256 issuedAt;          // unix time from Lit Action
        uint256 expiresAt;            // issuedAt + 5 minutes
        uint256 dstChainId;        // destination chain id to prevent cross-chain replay
        address dstContract;       // destination chain verifier contract, to prevent cross-contract replay
    }


    /* ========== ERRORS ========== */
    error CallerNotAppManager(uint40 appId, address caller, address recoveredSigner);
    error OwnerAttestationIncorrectSigner(address correctSigner, address recoveredSigner);
    error OwnerAttestationIncorrectAppId(uint40 correctAppId, uint256 signedAppId);
    error OwnerAttestationExpired(uint256 expiration);
    error OwnerAttestationIssuedAtInFuture(uint256 issuedAt);
    error OwnerAttestationIncorrectChainId(uint256 chainId);
    error OwnerAttestationIncorrectDestinationContract(address dstContract);


    /* ========== EVENTS ========== */
    event AppFeesWithdrawn(uint40 indexed appId, address indexed tokenAddress, uint256 amount);
    event PerformanceFeePercentageSet(uint256 newPerformanceFeePercentage);
    event SwapFeePercentageSet(uint256 newSwapFeePercentage);
    event AavePoolSet(address newAavePool);
    event AerodromeRouterSet(address newAerodromeRouter);
    event LitAppFeeSplitPercentageSet(uint256 newLitAppFeeSplitPercentage);
    event OwnerAttestationSignerSet(address newOwnerAttestationSigner);



    /* ========== MODIFIERS ========== */
    modifier onlyOwner() {
        if (msg.sender != LibDiamond.contractOwner()) {
            revert FeeUtils.CallerNotOwner();
        }
        _;
    }

    modifier onlyAppManager(uint40 appId, OwnerAttestation calldata oa, bytes calldata sig) {
        // app id 0 is the lit foundation
        if (appId == LibFeeStorage.LIT_FOUNDATION_APP_ID) {
            if (msg.sender != LibDiamond.contractOwner()) {
                revert FeeUtils.CallerNotOwner();
            }
        } else {
            verifyOwnerAttestation(appId, oa, sig);
        }
        _;
    }

    /* ========== VIEWS ========== */

    function verifyOwnerAttestation(uint40 appId, OwnerAttestation calldata oa, bytes calldata sig) public {
        // verify the signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            oa.srcChainId,
            oa.srcContract,
            oa.owner,
            oa.appId,
            oa.issuedAt,
            oa.expiresAt,
            oa.dstChainId,
            oa.dstContract
        ));
        address signer = messageHash.toEthSignedMessageHash().recover(sig);
        if (signer != LibFeeStorage.getStorage().ownerAttestationSigner){
            revert OwnerAttestationIncorrectSigner(LibFeeStorage.getStorage().ownerAttestationSigner, signer);
        }
        if (msg.sender != oa.owner) {
            revert CallerNotAppManager(appId, oa.owner, msg.sender);
        }
        if (oa.appId != appId) {
            revert OwnerAttestationIncorrectAppId(appId, oa.appId);
        }
        if (oa.issuedAt > block.timestamp) {
            revert OwnerAttestationIssuedAtInFuture(oa.issuedAt);
        }
        if (oa.expiresAt < block.timestamp) {
            revert OwnerAttestationExpired(oa.expiresAt);
        }
        if (oa.dstChainId != block.chainid) {
            revert OwnerAttestationIncorrectChainId(oa.dstChainId);
        }
        if (oa.dstContract != address(this)) {
            revert OwnerAttestationIncorrectDestinationContract(oa.dstContract);
        }
    }

    /**
     * @notice Gets the owner attestation signer wallet address
     * @return the owner attestation signer wallet address
     */
    function ownerAttestationSigner() external view returns (address) {
        return LibFeeStorage.getStorage().ownerAttestationSigner;
    }

    /**
     * @notice Gets the performance fee percentage
     * @return the performance fee percentage in basis points
     * so 1000 = 10%.  multiply percentage by 100 to get basis points
     */
    function performanceFeePercentage() external view returns (uint256) {
        return LibFeeStorage.getStorage().performanceFeePercentage;
    }

    /**
     * @notice Gets the swap fee percentage
     * @return the swap fee percentage in basis points
     * so 25 = 0.25%.  multiply percentage by 100 to get basis points
     */
    function swapFeePercentage() external view returns (uint256) {
        return LibFeeStorage.getStorage().swapFeePercentage;
    }

    /**
     * @notice Gets the entire list of tokens that have collected fees
     * if this list gets too long and the view call is timing out,
     * you can use the "one at a time" functions below
     * @param appId the app id to get the tokens for
     * @return the list of tokens that have collected fees
     */
    function tokensWithCollectedFees(uint40 appId) external view returns (address[] memory) {
        return LibFeeStorage.getStorage().tokensWithCollectedFees[appId].values();
    }

    /**
     * @notice Gets the length of the tokensWithCollectedFees set
     * @param appId the app id to get the length for
     * @return the length of the tokensWithCollectedFees set
     */
    function tokensWithCollectedFeesLength(uint40 appId) external view returns (uint256) {
        return LibFeeStorage.getStorage().tokensWithCollectedFees[appId].length();
    }

    /**
     * @notice Gets the token at the given index in the tokensWithCollectedFees set
     * @param appId the app id to get the token for
     * @param index the index of the token to get
     * @return the token at the given index
     */
    function tokensWithCollectedFeesAtIndex(uint40 appId, uint256 index) external view returns (address) {
        return LibFeeStorage.getStorage().tokensWithCollectedFees[appId].at(index);
    }

    /**
     * @notice Gets the aave pool contract address for this chain
     * @return the aave pool contract address for this chain
     */
    function aavePool() external view returns (address) {
        return LibFeeStorage.getStorage().aavePool;
    }

    /**
     * @notice Gets the aerodrome router contract address for this chain
     * @return the aerodrome router contract address for this chain
     */
    function aerodromeRouter() external view returns (address) {
        return LibFeeStorage.getStorage().aerodromeRouter;
    }

    /**
     * @notice Gets the litAppFeeSplitPercentage
     * @return the litAppFeeSplitPercentage, expressed in basis points
     * so 1000 = 10% goes to Lit, 90% goes to the app that initiated the action.  multiply percentage by 100 to get basis points
     */
    function litAppFeeSplitPercentage() external view returns (uint256) {
        return LibFeeStorage.getStorage().litAppFeeSplitPercentage;
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
     * @notice Sets the owner attestation signer contract address
     * @param newOwnerAttestationSigner the new owner attestation signer contract address
     * @dev this can only be called by the owner
     */
    function setOwnerAttestationSigner(address newOwnerAttestationSigner) external onlyOwner {
        LibFeeStorage.getStorage().ownerAttestationSigner = newOwnerAttestationSigner;
        emit OwnerAttestationSignerSet(newOwnerAttestationSigner);
    }

    /**
     * @notice Withdraws a token from the fee contract.
     * Can only remove the full balance of the token
     * @param tokenAddress the address of the token to withdraw
     * @dev this can only be called by the app manager
     */
    function withdrawAppFees(uint40 appId, address tokenAddress, OwnerAttestation calldata ownerAttestation, bytes calldata ownerAttestationSig) external onlyAppManager(appId, ownerAttestation, ownerAttestationSig) {
        // remove the token from the set of tokens that have collected fees
        // since we're withdrawing the full balance of the token
        LibFeeStorage.getStorage().tokensWithCollectedFees[appId].remove(tokenAddress);

        // get the token and amount for the app
        IERC20 token = IERC20(tokenAddress);
        uint256 amount = LibFeeStorage.getStorage().collectedAppFees[appId][tokenAddress];

        // zero out the amount for the app
        LibFeeStorage.getStorage().collectedAppFees[appId][tokenAddress] = 0;

        // transfer the token to the app manager
        token.transfer(msg.sender, amount);

        // emit the event
        emit AppFeesWithdrawn(appId, tokenAddress, amount);
    }

    /**
     * @notice Sets the performance fee percentage
     * @param newPerformanceFeePercentage the new performance fee percentage
     * in basis points
     * so 1000 = 10%.  multiply percentage by 100 to get basis points
     * @dev this can only be called by the owner
     */
    function setPerformanceFeePercentage(uint256 newPerformanceFeePercentage) external onlyOwner {
        LibFeeStorage.getStorage().performanceFeePercentage = newPerformanceFeePercentage;
        emit PerformanceFeePercentageSet(newPerformanceFeePercentage);
    }

    /**
     * @notice Sets the swap fee percentage
     * @param newSwapFeePercentage the new swap fee percentage
     * in basis points
     * so 25 = 0.25%.  multiply percentage by 100 to get basis points
     * @dev this can only be called by the owner
     */
    function setSwapFeePercentage(uint256 newSwapFeePercentage) external onlyOwner {
        LibFeeStorage.getStorage().swapFeePercentage = newSwapFeePercentage;
        emit SwapFeePercentageSet(newSwapFeePercentage);
    }

    /**
     * @notice Sets the aave pool contract address for this chain
     * @param newAavePool the new aave pool contract address for this chain
     * @dev this can only be called by the owner
     */
    function setAavePool(address newAavePool) external onlyOwner {
        LibFeeStorage.getStorage().aavePool = newAavePool;
        emit AavePoolSet(newAavePool);
    }

    /**
     * @notice Sets the aerodrome router contract address for this chain
     * @param newAerodromeRouter the new aerodrome router contract address for this chain
     * @dev this can only be called by the owner
     */
    function setAerodromeRouter(address newAerodromeRouter) external onlyOwner {
        LibFeeStorage.getStorage().aerodromeRouter = newAerodromeRouter;
        emit AerodromeRouterSet(newAerodromeRouter);
    }

    /**
     * @notice Sets the litAppFeeSplitPercentage
     * @param newLitAppFeeSplitPercentage the new litAppFeeSplitPercentage
     * in basis points
     * so 1000 = 10% goes to Lit, 90% goes to the app that initiated the action.  multiply percentage by 100 to get basis points
     * @dev this can only be called by the owner
     */
    function setLitAppFeeSplitPercentage(uint256 newLitAppFeeSplitPercentage) external onlyOwner {
        LibFeeStorage.getStorage().litAppFeeSplitPercentage = newLitAppFeeSplitPercentage;
        emit LitAppFeeSplitPercentageSet(newLitAppFeeSplitPercentage);
    }
}
