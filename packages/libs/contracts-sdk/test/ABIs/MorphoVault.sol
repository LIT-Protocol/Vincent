// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

interface MorphoVault {
    type Id is bytes32;

    struct MarketAllocation {
        MarketParams marketParams;
        uint256 assets;
    }

    struct MarketParams {
        address loanToken;
        address collateralToken;
        address oracle;
        address irm;
        uint256 lltv;
    }

    error AboveMaxTimelock();
    error AddressEmptyCode(address target);
    error AddressInsufficientBalance(address account);
    error AllCapsReached();
    error AlreadyPending();
    error AlreadySet();
    error BelowMinTimelock();
    error DuplicateMarket(Id id);
    error ECDSAInvalidSignature();
    error ECDSAInvalidSignatureLength(uint256 length);
    error ECDSAInvalidSignatureS(bytes32 s);
    error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed);
    error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed);
    error ERC20InvalidApprover(address approver);
    error ERC20InvalidReceiver(address receiver);
    error ERC20InvalidSender(address sender);
    error ERC20InvalidSpender(address spender);
    error ERC2612ExpiredSignature(uint256 deadline);
    error ERC2612InvalidSigner(address signer, address owner);
    error ERC4626ExceededMaxDeposit(address receiver, uint256 assets, uint256 max);
    error ERC4626ExceededMaxMint(address receiver, uint256 shares, uint256 max);
    error ERC4626ExceededMaxRedeem(address owner, uint256 shares, uint256 max);
    error ERC4626ExceededMaxWithdraw(address owner, uint256 assets, uint256 max);
    error FailedInnerCall();
    error InconsistentAsset(Id id);
    error InconsistentReallocation();
    error InvalidAccountNonce(address account, uint256 currentNonce);
    error InvalidMarketRemovalNonZeroCap(Id id);
    error InvalidMarketRemovalNonZeroSupply(Id id);
    error InvalidMarketRemovalTimelockNotElapsed(Id id);
    error InvalidShortString();
    error MarketNotCreated();
    error MarketNotEnabled(Id id);
    error MathOverflowedMulDiv();
    error MaxFeeExceeded();
    error MaxQueueLengthExceeded();
    error NoPendingValue();
    error NonZeroCap();
    error NotAllocatorRole();
    error NotCuratorNorGuardianRole();
    error NotCuratorRole();
    error NotEnoughLiquidity();
    error NotGuardianRole();
    error OwnableInvalidOwner(address owner);
    error OwnableUnauthorizedAccount(address account);
    error PendingCap(Id id);
    error PendingRemoval();
    error SafeCastOverflowedUintDowncast(uint8 bits, uint256 value);
    error SafeERC20FailedOperation(address token);
    error StringTooLong(string str);
    error SupplyCapExceeded(Id id);
    error TimelockNotElapsed();
    error UnauthorizedMarket(Id id);
    error ZeroAddress();
    error ZeroFeeRecipient();

    event AccrueInterest(uint256 newTotalAssets, uint256 feeShares);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares);
    event EIP712DomainChanged();
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event ReallocateSupply(address indexed caller, Id indexed id, uint256 suppliedAssets, uint256 suppliedShares);
    event ReallocateWithdraw(address indexed caller, Id indexed id, uint256 withdrawnAssets, uint256 withdrawnShares);
    event RevokePendingCap(address indexed caller, Id indexed id);
    event RevokePendingGuardian(address indexed caller);
    event RevokePendingMarketRemoval(address indexed caller, Id indexed id);
    event RevokePendingTimelock(address indexed caller);
    event SetCap(address indexed caller, Id indexed id, uint256 cap);
    event SetCurator(address indexed newCurator);
    event SetFee(address indexed caller, uint256 newFee);
    event SetFeeRecipient(address indexed newFeeRecipient);
    event SetGuardian(address indexed caller, address indexed guardian);
    event SetIsAllocator(address indexed allocator, bool isAllocator);
    event SetName(string name);
    event SetSkimRecipient(address indexed newSkimRecipient);
    event SetSupplyQueue(address indexed caller, Id[] newSupplyQueue);
    event SetSymbol(string symbol);
    event SetTimelock(address indexed caller, uint256 newTimelock);
    event SetWithdrawQueue(address indexed caller, Id[] newWithdrawQueue);
    event Skim(address indexed caller, address indexed token, uint256 amount);
    event SubmitCap(address indexed caller, Id indexed id, uint256 cap);
    event SubmitGuardian(address indexed newGuardian);
    event SubmitMarketRemoval(address indexed caller, Id indexed id);
    event SubmitTimelock(uint256 newTimelock);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event UpdateLastTotalAssets(uint256 updatedTotalAssets);
    event UpdateLostAssets(uint256 newLostAssets);
    event Withdraw(
        address indexed sender, address indexed receiver, address indexed owner, uint256 assets, uint256 shares
    );

    function DECIMALS_OFFSET() external view returns (uint8);
    function DOMAIN_SEPARATOR() external view returns (bytes32);
    function MORPHO() external view returns (address);
    function acceptCap(MarketParams memory marketParams) external;
    function acceptGuardian() external;
    function acceptOwnership() external;
    function acceptTimelock() external;
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
    function asset() external view returns (address);
    function balanceOf(address account) external view returns (uint256);
    function config(Id) external view returns (uint184 cap, bool enabled, uint64 removableAt);
    function convertToAssets(uint256 shares) external view returns (uint256);
    function convertToShares(uint256 assets) external view returns (uint256);
    function curator() external view returns (address);
    function decimals() external view returns (uint8);
    function deposit(uint256 assets, address receiver) external returns (uint256 shares);
    function eip712Domain()
        external
        view
        returns (
            bytes1 fields,
            string memory name,
            string memory version,
            uint256 chainId,
            address verifyingContract,
            bytes32 salt,
            uint256[] memory extensions
        );
    function fee() external view returns (uint96);
    function feeRecipient() external view returns (address);
    function guardian() external view returns (address);
    function isAllocator(address) external view returns (bool);
    function lastTotalAssets() external view returns (uint256);
    function lostAssets() external view returns (uint256);
    function maxDeposit(address) external view returns (uint256);
    function maxMint(address) external view returns (uint256);
    function maxRedeem(address owner) external view returns (uint256);
    function maxWithdraw(address owner) external view returns (uint256 assets);
    function mint(uint256 shares, address receiver) external returns (uint256 assets);
    function multicall(bytes[] memory data) external returns (bytes[] memory results);
    function name() external view returns (string memory);
    function nonces(address owner) external view returns (uint256);
    function owner() external view returns (address);
    function pendingCap(Id) external view returns (uint192 value, uint64 validAt);
    function pendingGuardian() external view returns (address value, uint64 validAt);
    function pendingOwner() external view returns (address);
    function pendingTimelock() external view returns (uint192 value, uint64 validAt);
    function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)
        external;
    function previewDeposit(uint256 assets) external view returns (uint256);
    function previewMint(uint256 shares) external view returns (uint256);
    function previewRedeem(uint256 shares) external view returns (uint256);
    function previewWithdraw(uint256 assets) external view returns (uint256);
    function reallocate(MarketAllocation[] memory allocations) external;
    function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets);
    function renounceOwnership() external;
    function revokePendingCap(Id id) external;
    function revokePendingGuardian() external;
    function revokePendingMarketRemoval(Id id) external;
    function revokePendingTimelock() external;
    function setCurator(address newCurator) external;
    function setFee(uint256 newFee) external;
    function setFeeRecipient(address newFeeRecipient) external;
    function setIsAllocator(address newAllocator, bool newIsAllocator) external;
    function setName(string memory newName) external;
    function setSkimRecipient(address newSkimRecipient) external;
    function setSupplyQueue(Id[] memory newSupplyQueue) external;
    function setSymbol(string memory newSymbol) external;
    function skim(address token) external;
    function skimRecipient() external view returns (address);
    function submitCap(MarketParams memory marketParams, uint256 newSupplyCap) external;
    function submitGuardian(address newGuardian) external;
    function submitMarketRemoval(MarketParams memory marketParams) external;
    function submitTimelock(uint256 newTimelock) external;
    function supplyQueue(uint256) external view returns (Id);
    function supplyQueueLength() external view returns (uint256);
    function symbol() external view returns (string memory);
    function timelock() external view returns (uint256);
    function totalAssets() external view returns (uint256);
    function totalSupply() external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function transferOwnership(address newOwner) external;
    function updateWithdrawQueue(uint256[] memory indexes) external;
    function withdraw(uint256 assets, address receiver, address owner) external returns (uint256 shares);
    function withdrawQueue(uint256) external view returns (Id);
    function withdrawQueueLength() external view returns (uint256);
}
