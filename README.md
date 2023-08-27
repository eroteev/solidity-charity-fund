# Hardhat Charity Fund Project

Task Name: "Charity Fund Smart Contract"

Develop a simple smart contract (dApp) using Solidity.

The smart contract must accomplish the following:

Fund creation: The contract owner (the address which deploys the contract) should be able to create a new charity fund with a specific cause and a target amount in Ether.

Donation: Any Ethereum address should be able to donate Ether to a charity fund. The contract should prevent donations that would exceed the fund's target amount.

Fund completion: Once the target amount of a fund is reached, the fund should automatically close and no further donations should be accepted. The contract owner should be able to withdraw the funds.

Transparency: The contract should also be able to provide public view functions to check the total amount donated to a fund, the remaining amount needed to reach the target, and whether the fund is still open or closed.

Bonus: Implement a refund function where if the fund's target amount is not reached within a certain time frame, donors can get their donations refunded.

Expected Outcomes:

Smart Contract that accomplishes the above features.
A test suite to ensure the contract works as expected.

# Tests

```shell
npx hardhat test
```

Coverage report
```
------------------|----------|----------|----------|----------|----------------|
File              |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
------------------|----------|----------|----------|----------|----------------|
 contracts/       |      100 |      100 |      100 |      100 |                |
  CharityFund.sol |      100 |      100 |      100 |      100 |                |
  Lock.sol        |      100 |      100 |      100 |      100 |                |
------------------|----------|----------|----------|----------|----------------|
All files         |      100 |      100 |      100 |      100 |                |
------------------|----------|----------|----------|----------|----------------|

> Istanbul reports written to ./coverage/ and ./coverage.json
```