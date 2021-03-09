# Dogethereum tools

Set of tools to be used by end users and operators to interact with https://github.com/dogethereum/dogethereum-contracts

If you are new to the Dogecoin <-> Ethereum bridge, please check the [docs](https://github.com/dogethereum/docs) repository first.

## Requirements
- npm version 7.3.0 or later.
- node version 15.5.1 or later.
- Dogecoin node running with RPC interface enabled.
- Ethereum node running with RPC interface enabled without password on port 8545.

## Installation
- `git clone https://github.com/dogethereum/dogethereum-tools`
- `cd dogethereum-tools`
- `npm install`

## Upgrading
If you are using an old version of the tools, you can upgrade to the latest one:
- `cd dogethereum-tools`
- `git pull`
- `npm install`


## Using the tools

### User tools

#### Lock

Converts doges on the dogecoin blockchain to doge tokens on the eth blockchain.

`node user/lock.js --ethnetwork <eth network> --value <number of doge satoshis>`

eg:

`node user/lock.js --ethnetwork rinkeby --value 200000000`


#### Print balances

Prints eth and doge token balances of an eth address.

`node user/print-balances.js --ethnetwork <eth network> --address <eth address>`

eg:

`node user/print-balances.js --ethnetwork rinkeby --address 0xd2394f3fad76167e7583a876c292c86ed1ffffff`

#### Import doge key to eth

Imports a dogecoin private key to ethereum node and unlocks it.<br/>
After using the lock tool, the user will get doge tokens on the eth address controlled by the same private key that signed the dogecoin lock transaction.<br/>
In order to use the tokens, the user should import the private key to the ethereum node.

`node user/import-doge-key-to-eth.js --privateKey <private key in eth format>`

eg:

`node user/import-doge-key-to-eth.js --privateKey  0x17ad918b6f62b449f3978eafd5bf237e2dec84f1e0366babf88ef3850691adbc`


#### Transfer Eth

Transfers eth from one eth address to another.<br/>
This is useful to fund the eth address that received doge tokens. In order to use the tokens, the address needs a small amount of eth to pay eth tx fees.

`node user/transfer-eth.js --ethnetwork <eth network> --sender <from eth address> --receiver <to eth address> --value <number of weis>`

eg:

`node user/transfer-eth.js --ethnetwork rinkeby --sender 0xd2394f3fad76167e7583a876c292c86ed10305da --receiver 0xd2394f3fad76167e7583a876c292c86ed1ffffff --value 10000000000000000`


#### Transfer Tokens

Transfers doge tokens from one user to another.

`node user/transfer-tokens.js --ethnetwork <eth network> --sender <from eth account> --receiver <to eth account> --value <number of tokens>`

eg:

`node user/transfer-tokens.js --ethnetwork rinkeby --sender 0xd2394f3fad76167e7583a876c292c86ed10305da --receiver 0xd2394f3fad76167e7583a876c292c86ed1ffffff --value 1`



#### Unlock

Converts doge tokens on the eth blockchain to doges on the dogecoin blockchain.

`node user/unlock.js --ethnetwork <eth network> --sender <from eth account> --receiver <to doge address> --value <number of tokens>`

eg:

`node user/unlock.js --ethnetwork rinkeby --sender 0xd2394f3fad76167e7583a876c292c86ed10305da --receiver ncbC7ZY1K9EcMVjvwbgSBWKQ4bwDWS4d5P --value 300000000`

### Operator tools

#### Add operator

Registers a new operator.

`node operator/addoperator.js --ethnetwork <eth network> --privateKey <operator private key in eth format> --ethAddress <operator eth address>`

eg:

`node operator/addoperator.js --ethnetwork rinkeby --privateKey 0x105bd30419904ef409e9583da955037097f22b6b23c57549fe38ab8ffa9deaa3 --ethAddress 0xedaf5d525674475a1b546945acfa3b0cbc41f1a7`


#### Add operator deposit

Transfers eth from the operator account to the DogeToken contract.

`node operator/addoperatordeposit.js --ethnetwork <eth network> --operatorPublicKeyHash <operator public key hash> --value <number of weis to deposit> --ethAddress <operator eth address>`

eg:

`node operator/addoperatordeposit.js --ethnetwork rinkeby --operatorPublicKeyHash 0x03cd041b0139d3240607b9fd1b2d1b691e22b5d6 --value 1000000000000000000 --ethAddress 0xd2394f3fad76167e7583a876c292c86ed1ffffff`

#### Print status

Prints operator status.

`node operator/print-status.js --ethnetwork <eth network> --operatorPublicKeyHash <operator public key hash>`

eg:

`node operator/print-status.js --ethnetwork rinkeby --operatorPublicKeyHash 0x03cd041b0139d3240607b9fd1b2d1b691e22b5d6`



#### Withdraw operator deposit

Transfers eth from the DogeToken contract to the operator account.

`node operator/withdrawoperatordeposit.js --ethnetwork <eth network> --operatorPublicKeyHash <operator public key hash> --value <number of weis to withdraw> --ethAddress <operator eth address>`

eg:

`node operator/withdrawoperatordeposit.js --ethnetwork rinkeby --operatorPublicKeyHash 0x03cd041b0139d3240607b9fd1b2d1b691e22b5d6 --value 1000000000000000000 --ethAddress 0xd2394f3fad76167e7583a876c292c86ed1ffffff`

## License

MIT License<br/>
Copyright (c) 2018 Coinfabrik & Oscar Guindzberg<br/>
[License](LICENSE)
