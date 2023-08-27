import { ethers } from "hardhat";

export async function main() {
  const charityFund = await ethers.deployContract("CharityFund");
  await charityFund.waitForDeployment();
  console.log(`The Library contract is deployed to ${charityFund.target}`);
}
