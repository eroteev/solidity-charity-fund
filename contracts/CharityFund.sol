// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract CharityFund is Ownable {
    struct Fund {
        uint32 id;
        uint32 duration;
        string cause;
        uint256 targetAmount;
        uint256 donatedAmount;
        uint256 start;
        bool isOpen;
        bool isAmountWithdrawn;
    }

    mapping(uint32 => Fund) private _idToFund;
    mapping(address => mapping(uint32 => uint256)) private _userToFundDonationAmount;

    event FundCreated(uint32 fundId);
    event AmountDonated(uint32 fundId, address from, uint256 amount);
    event AmountWithdrawn(uint32 fundId);
    event AddressRefunded(uint32 fundId, address user, uint256 amount);

    error FundAlreadyExists();
    error FundNotFound();
    error FundIsClosed();
    error FundIsOpen();
    error AmountIsAlreadyWithdrawn();
    error AmountIsNotPositiveNumber();
    error DonationExceedsTargetAmount();
    error FundDurationNotReached();
    error NoAmountToBeRefunded();


    modifier validFund(uint32 fundId) {
        if (_idToFund[fundId].id == 0) {
            revert FundNotFound();
        }
        _;
    }
    

    function createFund(uint32 fundId, string calldata cause, uint256 targetAmount, uint32 duration) external onlyOwner {
        Fund storage fund = _idToFund[fundId];
        if (fund.id > 0) {
            revert FundAlreadyExists();
        }

        fund.id = fundId;
        fund.duration = duration;
        fund.cause = cause;
        fund.targetAmount = targetAmount;
        fund.start = block.timestamp;
        fund.isOpen = true;
        fund.isAmountWithdrawn = false;

        emit FundCreated(fundId);
    }

    function getFund(uint32 fundId) external view validFund(fundId) returns (Fund memory fund) {
        return _idToFund[fundId];
    }

    function getTotalDonatedAmount(uint32 fundId) external view validFund(fundId) returns (uint256) {
        return _idToFund[fundId].donatedAmount;
    }

    function getRemainingAmountToTarget(uint32 fundId) external view validFund(fundId) returns (uint256) {
        Fund memory fund = _idToFund[fundId];

        return fund.targetAmount - fund.donatedAmount;
    }

    function isOpen(uint32 fundId) external view validFund(fundId) returns (bool) {
        return _idToFund[fundId].isOpen;
    }

    function donate(uint32 fundId) external payable validFund(fundId)  {
        Fund storage fund = _idToFund[fundId];
        uint256 amount = msg.value;

        if (!fund.isOpen) {
            revert FundIsClosed();
        }

        if (amount == 0) {
            revert AmountIsNotPositiveNumber();
        }

        if (fund.donatedAmount + amount > fund.targetAmount) {
            revert DonationExceedsTargetAmount();
        }

        fund.donatedAmount += amount;

        _userToFundDonationAmount[msg.sender][fund.id] += amount;

        emit AmountDonated(fundId, msg.sender, amount);

        if (fund.donatedAmount == fund.targetAmount) {
            fund.isOpen = false;
        }
    }

    function withdraw (uint32 fundId) external validFund(fundId) onlyOwner {
        Fund storage fund = _idToFund[fundId];

        if (fund.isOpen) {
            revert FundIsOpen();
        }

        if (fund.isAmountWithdrawn) {
            revert AmountIsAlreadyWithdrawn();
        }

        Address.sendValue(payable(owner()), fund.donatedAmount);

        fund.isAmountWithdrawn = true;

        emit AmountWithdrawn(fundId);
    }

    function refund (uint32 fundId) external validFund(fundId) {
        Fund storage fund = _idToFund[fundId];

        if (!fund.isOpen) {
            revert FundIsClosed();
        }

        if (fund.start + fund.duration >= block.timestamp) {
            revert FundDurationNotReached();
        }

        uint256 refundAmount = _userToFundDonationAmount[msg.sender][fund.id];

        if (refundAmount == 0) {
            revert NoAmountToBeRefunded();
        }

        Address.sendValue(payable(msg.sender), refundAmount);

        emit AddressRefunded(fundId, msg.sender, refundAmount);
    }
}
