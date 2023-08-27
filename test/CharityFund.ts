import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { CharityFund } from "../typechain-types";

describe.only("CharityFund", function () {
    function fund1() {
        return [1, "Animal Walfare", ethers.parseUnits("0.5", "ether"), "3600"];
    }

    function fund2() {
        return [2, "Global Warming", ethers.parseUnits("2", "ether"), "3600"];
    }

    function fund3() {
        return [3, "Cancer", ethers.parseUnits("1", "ether"), "3600"];
    }

    async function deployContract() {
        const [owner, otherAccount] = await ethers.getSigners();

        const CharityFund = await ethers.getContractFactory("CharityFund");
        const charityFund: CharityFund = await CharityFund.deploy();

        return { charityFund, owner, otherAccount };
    }

    async function deployContractWithFunds() {
        const [owner, otherAccount] = await ethers.getSigners();

        const CharityFund = await ethers.getContractFactory("CharityFund");
        const charityFund: CharityFund = await CharityFund.deploy();

        await charityFund.createFund(...fund1());

        return { charityFund, owner, otherAccount };
    }

    async function deployContractWithFundsAndDontations() {
        const [owner, otherAccount] = await ethers.getSigners();

        const CharityFund = await ethers.getContractFactory("CharityFund");
        const charityFund: CharityFund = await CharityFund.deploy();

        await charityFund.createFund(...fund1());
        await charityFund.connect(otherAccount).donate(1, {
            value: ethers.parseUnits("0.2", "ether")
        });

        await charityFund.createFund(...fund2());
        await charityFund.connect(otherAccount).donate(2, {
            value: ethers.parseUnits("2", "ether")
        });

        await charityFund.createFund(...fund3());
        await charityFund.donate(3, {
            value: ethers.parseUnits("0.5", "ether")
        });

        return { charityFund, owner, otherAccount };
    }

    

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            const { charityFund, owner } = await loadFixture(deployContract);

            expect(await charityFund.owner()).to.equal(owner.address);
        });
    });

    describe("createFund", function () {
        it("Should create fund", async function () {
            const { charityFund } = await loadFixture(deployContract);

            await expect(charityFund.createFund(...fund1())).to.not.be.reverted;

            const fund: CharityFund.FundStruct = await charityFund.getFund(1);
            expect(fund.id).to.equal(1);
            expect(fund.cause).to.equal("Animal Walfare");
            expect(fund.targetAmount).to.equal(ethers.parseUnits("0.5", "ether"));
            expect(fund.donatedAmount).to.equal(0);
            expect(fund.isOpen).to.equal(true);
            expect(fund.isAmountWithdrawn).to.equal(false);
        });

        it("Should emit FundCreated event", async function () {
            const { charityFund } = await loadFixture(deployContract);

            await expect(charityFund.createFund(...fund1()))
                .to.emit(charityFund, "FundCreated")
                .withArgs(1);
        });

        it("Should revert if not called by the owner", async function () {
            const { charityFund, otherAccount } = await loadFixture(deployContract);
            await expect(charityFund.connect(otherAccount).createFund(...fund1())).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should revert if the fund already exists", async function () {
            const { charityFund } = await loadFixture(deployContractWithFunds);
            await expect(charityFund.createFund(...fund1())).to.be.revertedWithCustomError(charityFund, "FundAlreadyExists");
        });
    });

    describe("getFund", function() {
        it("Should return fund specified by id", async function () {
            const { charityFund, otherAccount } = await loadFixture(deployContractWithFunds);

            const fund: CharityFund.FundStruct = await charityFund.getFund(1);

            expect(fund.cause).to.equal("Animal Walfare");
            expect(fund.targetAmount).to.equal(ethers.parseUnits("0.5", "ether"));
            expect(fund.donatedAmount).to.equal(0);
            expect(fund.isOpen).to.equal(true);
        });

        it("Should revert if the fund does not exist", async function () {
            const { charityFund, otherAccount } = await loadFixture(deployContractWithFunds);

            await expect(charityFund.getFund(123)).to.be.revertedWithCustomError(charityFund, "FundNotFound");
        });
    });

    describe("getTotalDonatedAmount", function() {
        it("Should return total donated amount", async function () {
            const { charityFund, otherAccount } = await loadFixture(deployContractWithFundsAndDontations);

            const totalDonatedAmount = await charityFund.getTotalDonatedAmount(1);

            expect(totalDonatedAmount).to.equal(ethers.parseUnits("0.2", "ether"));
        });

        it("Should revert if the fund does not exist", async function () {
            const { charityFund, otherAccount } = await loadFixture(deployContractWithFunds);

            await expect(charityFund.getTotalDonatedAmount(123)).to.be.revertedWithCustomError(charityFund, "FundNotFound");
        });
    });

    describe("getRemainingAmountToTarget", function() {
        it("Should return the remaining amount to target", async function () {
            const { charityFund, otherAccount } = await loadFixture(deployContractWithFundsAndDontations);

            const remaining = await charityFund.getRemainingAmountToTarget(1);

            expect(remaining).to.equal(ethers.parseUnits("0.3", "ether"));
        });

        it("Should revert if the fund does not exist", async function () {
            const { charityFund, otherAccount } = await loadFixture(deployContractWithFunds);

            await expect(charityFund.getRemainingAmountToTarget(123)).to.be.revertedWithCustomError(charityFund, "FundNotFound");
        });
    });

    describe("isOpen", function() {
        it("Should true when the fund is open", async function () {
            const { charityFund, otherAccount } = await loadFixture(deployContractWithFundsAndDontations);

            const isOpen = await charityFund.isOpen(1);

            expect(isOpen).to.equal(true);
        });

        it("Should false when the fund is closed", async function () {
            const { charityFund, otherAccount } = await loadFixture(deployContractWithFundsAndDontations);

            await charityFund.connect(otherAccount).donate(1, {
                value: ethers.parseUnits("0.3", "ether")
            });

            const isOpen = await charityFund.isOpen(1);

            expect(isOpen).to.equal(false);
        });

        it("Should revert if the fund does not exist", async function () {
            const { charityFund, otherAccount } = await loadFixture(deployContractWithFunds);

            await expect(charityFund.isOpen(123)).to.be.revertedWithCustomError(charityFund, "FundNotFound");
        });
    });

    describe("donate", function () {
        it("Should allow user to donate to specific fund", async function () {
            const { charityFund, otherAccount } = await loadFixture(deployContractWithFunds);

            await expect(charityFund.connect(otherAccount).donate(1, {
                value: ethers.parseUnits("0.3", "ether")
            })).to.not.be.reverted;
        });

        it("Should emit AmountDonated event", async function () {
            const { charityFund, otherAccount } = await loadFixture(deployContractWithFunds);

            await expect(charityFund.connect(otherAccount).donate(1, {
                value: ethers.parseUnits("0.3", "ether")
            })).to.emit(charityFund, "AmountDonated")
                .withArgs(1, otherAccount.address, ethers.parseUnits("0.3", "ether"));
        });

        it("Should close the fund if donated amount equals target amount", async function () {
            const { charityFund, otherAccount } = await loadFixture(deployContractWithFunds);

            await expect(charityFund.connect(otherAccount).donate(1, {
                value: ethers.parseUnits("0.5", "ether")
            })).to.not.be.reverted;

            const fund: CharityFund.FundStruct = await charityFund.getFund(1);

            await expect(fund.isOpen).to.be.false;
        });

        it("Should revert if the fund is already closed", async function () {
            const { charityFund, otherAccount } = await loadFixture(deployContractWithFunds);

            await charityFund.connect(otherAccount).donate(1, {
                value: ethers.parseUnits("0.5", "ether")
            });

            await expect(charityFund.connect(otherAccount).donate(1, {
                value: ethers.parseUnits("0.1", "ether")
            })).to.be.revertedWithCustomError(charityFund, "FundIsClosed");
        });

        it("Should revert if zero amount is sent", async function () {
            const { charityFund, otherAccount } = await loadFixture(deployContractWithFunds);


            await expect(charityFund.connect(otherAccount).donate(1, {
                value: 0
            })).to.be.revertedWithCustomError(charityFund, "AmountIsNotPositiveNumber");
        });

        it("Should revert if donation exceeds target amount", async function () {
            const { charityFund, otherAccount } = await loadFixture(deployContractWithFunds);


            await expect(charityFund.connect(otherAccount).donate(1, {
                value: ethers.parseUnits("3", "ether")
            })).to.be.revertedWithCustomError(charityFund, "DonationExceedsTargetAmount");
        });

        it("Should revert if the fund does not exist", async function () {
            const { charityFund, otherAccount } = await loadFixture(deployContractWithFunds);

            await expect(charityFund.connect(otherAccount).donate(123, {
                value: ethers.parseUnits("3", "ether")
            })).to.be.revertedWithCustomError(charityFund, "FundNotFound");
        });
    });

    describe("withdraw", function () {
        it("Should allow the owner to withdraw closed fund", async function () {
            const { charityFund, otherAccount } = await loadFixture(deployContractWithFundsAndDontations);

            await expect(charityFund.withdraw(2)).to.not.be.reverted;
        });

        it("Should NOT allow address which is not the owner to withdraw funds", async function () {
            const { charityFund, otherAccount } = await loadFixture(deployContractWithFundsAndDontations);

            await expect(charityFund.connect(otherAccount).withdraw(2)).to.be.revertedWith("Ownable: caller is not the owner")
        });

        it("Should NOT allow withdrawing from open fund", async function () {
            const { charityFund, otherAccount } = await loadFixture(deployContractWithFundsAndDontations);

            await expect(charityFund.withdraw(1)).to.be.revertedWithCustomError(charityFund, "FundIsOpen");
        });

        it("Should NOT allow the owner to withdraw fund more than once", async function () {
            const { charityFund, otherAccount } = await loadFixture(deployContractWithFundsAndDontations);

            await expect(charityFund.withdraw(2)).to.not.be.reverted;

            await expect(charityFund.withdraw(2)).to.be.revertedWithCustomError(charityFund, "AmountIsAlreadyWithdrawn");
        });

        it("Should emit AmountWithdrawn event", async function () {
            const { charityFund, otherAccount } = await loadFixture(deployContractWithFundsAndDontations);

            await expect(charityFund.withdraw(2)).to.emit(charityFund, "AmountWithdrawn")
                .withArgs(2);
        });

        it("Should revert if the fund does not exist", async function () {
            const { charityFund, otherAccount } = await loadFixture(deployContractWithFunds);

            await expect(charityFund.withdraw(123)).to.be.revertedWithCustomError(charityFund, "FundNotFound");
        });
    });

    describe("refund", function () {
        it("Should allow refunding address who has contributed if the fund is open and the duration has elapsed", async function () {
            const { charityFund, otherAccount } = await loadFixture(deployContractWithFundsAndDontations);

            await time.increase(3600);

            await expect(charityFund.connect(otherAccount).refund(1)).to.not.be.reverted;
        });

        it("Should NOT allow refunding if the fund is closed", async function () {
            const { charityFund, otherAccount } = await loadFixture(deployContractWithFundsAndDontations);

            await charityFund.connect(otherAccount).donate(1, {
                value: ethers.parseUnits("0.3", "ether")
            });

            await expect(charityFund.connect(otherAccount).refund(1)).to.be.revertedWithCustomError(charityFund, "FundIsClosed");
        });

        it("Should NOT allow refunding if the fund duration is not reached", async function () {
            const { charityFund, otherAccount } = await loadFixture(deployContractWithFundsAndDontations);

            await expect(charityFund.connect(otherAccount).refund(1)).to.be.revertedWithCustomError(charityFund, "FundDurationNotReached");
        });

        it("Should NOT allow refunding address who has not contributed to the fund", async function () {
            const { charityFund, otherAccount } = await loadFixture(deployContractWithFundsAndDontations);

            await time.increase(3600);

            await expect(charityFund.connect(otherAccount).refund(3)).to.be.revertedWithCustomError(charityFund, "NoAmountToBeRefunded");
        });

        it("Should revert if the fund does not exist", async function () {
            const { charityFund, otherAccount } = await loadFixture(deployContractWithFunds);

            await expect(charityFund.connect(otherAccount).refund(123)).to.be.revertedWithCustomError(charityFund, "FundNotFound");
        });

    });
});

