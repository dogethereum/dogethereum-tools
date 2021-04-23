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

`node user/lock.js --value <number of doge satoshis>  --dogePrivateKey <dogecoin private key in WIF> --utxoTxid <transaction id of the utxo> --utxoValue <value held by the utxo> --utxoIndex <index of the utxo in the transaction>`

eg:

`node user/lock.js --value 200000000 --dogePrivateKey cW9yAP8NRgGGN2qQ4vEQkvqhHFSNzeFPWTLBXriy5R5wf4KBWDbc --utxoTxid 34bae623d6fd05ac5d57045d0806c78e2f73f44261f0fb5ffe386cd130fad757 --utxoValue 1000000000 --utxoIndex 0`


#### Print balances

Prints eth and doge token balances of an eth address.

`node user/print-balances.js --address <eth address>`

eg:

`node user/print-balances.js --address 0xd2394f3fad76167e7583a876c292c86ed1ffffff`

#### Convert doge key to eth

Converts a dogecoin private key to ethereum node and prints it to stdout.<br/>
After using the lock tool, the user will get doge tokens on the eth address controlled by the same private key that signed the dogecoin lock transaction.<br/>
In order to use the tokens, the user should convert the private key to the ethereum format so it can be used with the other operations.

`node user/import-doge-key-to-eth.js --dogePrivateKey <private key in dogecoin format>`

eg:

`node user/import-doge-key-to-eth.js --dogePrivateKey  Kdef456def456def456def456def456def456def456def456def`


#### Transfer Eth

Transfers eth from one eth address to another.<br/>
This is useful to fund the eth address that received doge tokens. In order to use the tokens, the address needs a small amount of eth to pay eth tx fees.

`node user/transfer-eth.js --privateKey <sender private key> --receiver <to eth address> --value <number of weis>`

eg:

`node user/transfer-eth.js --privateKey 0x105bd30419904ef409e9583da955037097f22b6b23c57549fe38ab8ffa9deaa3 --receiver 0xd2394f3fad76167e7583a876c292c86ed1ffffff --value 10000000000000000`


#### Transfer Tokens

Transfers doge tokens from one user to another.

`node user/transfer-tokens.js --privateKey <sender private key> --receiver <to eth account> --value <number of tokens>`

eg:

`node user/transfer-tokens.js --privateKey 0x105bd30419904ef409e9583da955037097f22b6b23c57549fe38ab8ffa9deaa3 --receiver 0xd2394f3fad76167e7583a876c292c86ed1ffffff --value 1`



#### Unlock

Converts doge tokens on the eth blockchain to doges on the dogecoin blockchain.

`node user/unlock.js --privateKey <sender private key> --receiver <to doge address> --value <number of tokens>`

eg:

`node user/unlock.js --privateKey 0x105bd30419904ef409e9583da955037097f22b6b23c57549fe38ab8ffa9deaa3 --receiver ncbC7ZY1K9EcMVjvwbgSBWKQ4bwDWS4d5P --value 300000000`

### Operator tools

#### Add operator

Registers a new operator.

`node operator/addoperator.js --privateKey <operator dogecoin private key in eth format> --ethPrivateKey <operator eth private key>`

eg:

`node operator/addoperator.js --privateKey 0x105bd30419904ef409e9583da955037097f22b6b23c57549fe38ab8ffa9deaa3 --ethAddress 0xedaf5d525674475a1b546945acfa3b0cbc41f1a7`


#### Add operator deposit

Transfers eth from the operator account to the DogeToken contract.

`node operator/addoperatordeposit.js --operatorPublicKeyHash <operator public key hash> --value <number of weis to deposit> --ethAddress <operator eth address>`

eg:

`node operator/addoperatordeposit.js --operatorPublicKeyHash 0x03cd041b0139d3240607b9fd1b2d1b691e22b5d6 --value 1000000000000000000 --ethAddress 0xd2394f3fad76167e7583a876c292c86ed1ffffff`

#### Print status

Prints operator status.

`node operator/print-status.js --operatorPublicKeyHash <operator public key hash>`

eg:

`node operator/print-status.js --operatorPublicKeyHash 0x03cd041b0139d3240607b9fd1b2d1b691e22b5d6`



#### Withdraw operator deposit

Transfers eth from the DogeToken contract to the operator account.

`node operator/withdrawoperatordeposit.js --operatorPublicKeyHash <operator public key hash> --value <number of weis to withdraw> --ethAddress <operator eth address>`

eg:

`node operator/withdrawoperatordeposit.js --operatorPublicKeyHash 0x03cd041b0139d3240607b9fd1b2d1b691e22b5d6 --value 1000000000000000000 --ethAddress 0xd2394f3fad76167e7583a876c292c86ed1ffffff`

## License

MIT License<br/>
Copyright (c) 2018 Coinfabrik & Oscar Guindzberg<br/>
[License](LICENSE)
