# Dogethereum tools
Set of tools to be used by end users to interact with https://github.com/dogethereum/dogethereum-contracts

## Before using the tools, make sure 
- Ethereum node is up and running, rpc is enabled without password on port 8545.
- Ethereum node has the private key for the sending account. 
- The sending account has both eth (to pay tx fees) and doge tokens.

## Requirements
- npm version 5.5.1 or later.
- node version 9.2.0 or later.

## Installation
- npm install

## Using the tools

### Transfer

`node user/transfer.js --network <eth network> --sender <from eth account> --receiver <to eth account> --value <number of tokens>`

eg:

`node user/transfer.js --network ropsten --sender 0xd2394f3fad76167e7583a876c292c86ed10305da --receiver 0xd2394f3fad76167e7583a876c292c86ed1ffffff --value 1`

### Unlock

`node user/unlock.js --network <eth network> --sender <from eth account> --receiver <to doge address> --value <number of tokens>`

eg:

`node user/unlock.js --network ropsten --sender 0xd2394f3fad76167e7583a876c292c86ed10305da --receiver ncbC7ZY1K9EcMVjvwbgSBWKQ4bwDWS4d5P --value 300000000`
