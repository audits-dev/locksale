# Timelock ICO Contract (LockSale)

A timelock ICO is different than a regular ICO. It requires the entity deploy the contract to purchase their own token at the same rate as their users. It also does not give ETH to the raising entity, instead, it simply locks that ETH for a specified period of time. After that time has passed, users may withdraw their ETH while retaining their tokens.

## Why?

- ETH is being used as fundraising of other projects, but is being sold right back to the market (for obvious reasons). This approach requires the entity raising funds to have skin in the game, or some availability of funds before-hand. If they believe their project will have value, they have the ability to buy their own token as early as deployment time.
- Locking ETH is an opportunity cost. Users (and the deployer) lose access to that ETH for the duration of the lockout period. It is up to the deployer to set that duration.
- If the project delivers actual usage for the token, the ETH will remain locked for as long as users require purchasing more tokens. If users stop purchasing tokens with ETH, they will be able to withdraw it once passed the lockout duration.

## Usage

The initial supply, rate, and lockout duration will be set upon the contract's deployment. Contract deployment will also create the token and send the initial supply to the deployer. Included is a very basic ERC20 token, which provides no additional functionality.

To purchase tokens, simply send ETH to the contract address and tokens will automatically be sent to you via the token's mint function. This will lock your ETH in the contract for the duration specified on deployment. If more ETH is sent to the contract at a later time, the lockout duration will be reset, preventing you from withdrawing your ETH for the entire lockout duration again.