"use strict";

const utils = require("../utils");
const formatconverter = require("./formatconverter");
const yargs = require("yargs");
const BitcoindRpc = require("bitcoind-rpc");
const bitcoreLib = require("bitcore-lib");
const bitcoinjsLib = require("bitcoinjs-lib");
const {
  DOGECOIN_MAINNET,
  DOGECOIN_TESTNET,
  DOGECOIN_REGTEST,
  ERRORS,
} = require("./dogeProtocol");

/**
 * This implements the user "crossing" the bridge from dogecoin to ethereum.
 * The user deposits an amount of dogecoin with one or more operators to get
 * an equivalent amount of doge tokens in the ethereum network.
 * This accepts a single utxo that should belong to a P2PKH transaction.
 *
 * @dev Note that this is a naive implementation. It eagerly locks dogecoin
 * with the first operator in the doge token contract and proceeds to the
 * next operator if the requested amount was not reached.
 * @todo Add support for other transaction types like P2PK.
 */
async function doIt() {
  const argv = utils.completeYargs(
    yargs
      .option("dt", {
        group: "Optional:",
        alias: "dogehost",
        default: "127.0.0.1",
        type: "string",
        describe: "host of the dogecoin node",
        demandOption: false,
      })
      .option("dp", {
        group: "Optional:",
        alias: "dogeport",
        default: 22555, //mainnet: 22555 or testnet: 44555
        describe: "port of the dogecoin node rpc",
        type: "number",
        check: (val) => val >= 1 && val <= 65535,
        demandOption: false,
      })
      .option("du", {
        group: "Optional:",
        alias: "dogeuser",
        default: "",
        type: "string",
        describe: "user of the dogecoin node rpc",
        demandOption: false,
      })
      .option("dd", {
        group: "Optional:",
        alias: "dogepassword",
        default: "",
        type: "string",
        describe: "password of the dogecoin node rpc",
        demandOption: false,
      })
      .option("dn", {
        group: "Optional:",
        alias: "dogenetwork",
        describe: "Doge network to be used",
        default: "mainnet",
        defaultDescription: "dogecoin mainnet network.",
        type: "string",
        choices: ["mainnet", "testnet", "regtest"],
        demandOption: false,
      })
      .option("v", {
        group: "Data:",
        alias: "value",
        describe: "number of doge satoshis to transfer",
        type: "number",
        demandOption: true,
      })
      .option("dpk", {
        group: "Data:",
        alias: "dogePrivateKey",
        describe: "dogecoin private key in WIF format",
        type: "string",
        demandOption: true,
      })
      .option("ut", {
        group: "Data:",
        alias: "utxoTxid",
        describe: "dogecoin unspent transaction output tx id",
        type: "string",
        demandOption: true,
      })
      .option("ui", {
        group: "Data:",
        alias: "utxoIndex",
        describe: "dogecoin unspent transaction output index",
        type: "number",
        demandOption: true,
      })
      .option("uv", {
        group: "Data:",
        alias: "utxoValue",
        describe: "value held by dogecoin unspent transaction output",
        type: "number",
        demandOption: true,
      })
      .usage(
        `Converts doges on the dogecoin blockchain to doge tokens on the eth blockchain.
Usage: node user/lock.js --value <number of doge satoshis>  --dogePrivateKey <dogecoin private key in WIF> --utxoTxid <transaction id of the utxo> --utxoValue <value held by the utxo> --utxoIndex <index of the utxo in the transaction>`
      )
      .example(
        "node user/lock.js --value 200000000 --dogePrivateKey cW9yAP8NRgGGN2qQ4vEQkvqhHFSNzeFPWTLBXriy5R5wf4KBWDbc --utxoTxid 34bae623d6fd05ac5d57045d0806c78e2f73f44261f0fb5ffe386cd130fad757 --utxoValue 1000000000 --utxoIndex 0",
        "Lock 2 doges to get 2 doge tokens (minus fees) in the ethereum network"
      )
  ).argv;

  const { web3, dogeToken } = await utils.init(argv);

  const valueToLock = argv.value;

  console.log(`Lock ${utils.satoshiToDoge(valueToLock)} doges.`);

  const dogeRpcConfig = {
    protocol: "http",
    user: argv.dogeuser,
    pass: argv.dogepassword,
    host: argv.dogehost,
    port: argv.dogeport,
  };

  const dogecoinRpc = new BitcoindRpc(dogeRpcConfig);
  await invokeDogecoinRpc(dogecoinRpc, "getinfo");
  console.log("Connected to dogecoin node!");

  // Do some checks
  await utils.doSomeChecks(web3);
  if (!(valueToLock > 0)) {
    throw new Error("Value should be greater than 0");
  }

  // Do lock
  console.log("Initiating lock... ");
  const minLockValue = parseInt(
    await dogeToken.methods.MIN_LOCK_VALUE().call(),
    10
  );
  if (valueToLock < minLockValue) {
    throw new Error(
      `Value to lock ${valueToLock} doge satoshis is less than the minimum lock value ${minLockValue} doge satoshis`
    );
  }
  const dogeEthPrice = parseInt(
    await dogeToken.methods.dogeEthPrice().call(),
    10
  );
  const collateralRatio = parseInt(
    await dogeToken.methods.collateralRatio().call(),
    10
  );

  let utxo = {
    txid: argv.utxoTxid,
    index: argv.utxoIndex,
    value: argv.utxoValue,
  };

  const dogePrivateKey = argv.dogePrivateKey;
  const signingECPair = dogeKeyPairFromWIF(dogePrivateKey, argv.dogenetwork);
  const dogeAddressPrefix = getAddressPrefix(argv.dogenetwork);

  const operatorsLength = await dogeToken.methods.getOperatorsLength().call();
  let valueLocked = 0;
  for (let i = 0; i < operatorsLength; i++) {
    const {
      key: operatorPublicKeyHash,
      deleted,
    } = await dogeToken.methods.operatorKeys(i).call();
    if (deleted === false) {
      // not deleted

      console.log(`Operator public key hash: ${operatorPublicKeyHash}`);
      const operator = await dogeToken.methods
        .operators(operatorPublicKeyHash)
        .call();
      const operatorDogeAvailableBalance = parseInt(operator[1], 10);
      const operatorDogePendingBalance = parseInt(operator[2], 10);
      const operatorEthBalance = parseInt(operator[4], 10);

      const operatorReceivableDoges =
        operatorEthBalance / dogeEthPrice / collateralRatio -
        (operatorDogeAvailableBalance + operatorDogePendingBalance);

      if (operatorReceivableDoges >= minLockValue) {
        const valueToLockWithThisOperator = Math.min(
          valueToLock - valueLocked,
          operatorReceivableDoges
        );
        const operatorDogeAddress = bitcoreLib.encoding.Base58Check.encode(
          Buffer.concat([
            Buffer.from([dogeAddressPrefix]),
            utils.fromHex(operatorPublicKeyHash),
          ])
        );
        console.log(
          `Locking ${utils.satoshiToDoge(
            valueToLockWithThisOperator
          )} doges to address ${operatorDogeAddress} using operator ${operatorPublicKeyHash}`
        );

        // TODO: parametrize fee
        const txAndUtxo = createSendTx(
          operatorDogeAddress,
          valueToLockWithThisOperator,
          utxo,
          signingECPair,
          argv.dogenetwork
        );

        try {
          await invokeDogecoinRpc(
            dogecoinRpc,
            "sendrawtransaction",
            txAndUtxo.signedTx.toHex()
          );
        } catch (error) {
          if (
            error.code === ERRORS.RPC_VERIFY_REJECTED &&
            typeof error.message === "string" &&
            error.message.includes(
              "mandatory-script-verify-flag-failed (Non-canonical DER signature)"
            )
          ) {
            throw new Error(
              `The signature verification for the transaction failed. Is the transaction of the utxo a P2PKH transaction?
RPC error message: ${error.message}`
            );
          }

          throw error;
        }
        utxo = txAndUtxo.utxo;

        console.log(`Sent doge tx ${txAndUtxo.signedTx.getId()}`);
        valueLocked += valueToLockWithThisOperator;
      }
    }
    if (
      valueToLock - minLockValue <= valueLocked &&
      valueLocked <= valueToLock
    ) {
      break;
    }
  }

  // Show the private key and eth address for the dogecoin address
  const userPrivKeyInEthFormat = formatconverter.privKeyToEthFormat(
    dogePrivateKey
  );
  console.log(`User private key: ${userPrivKeyInEthFormat}`);
  const userEthAddress = formatconverter.getEthAddress(web3, dogePrivateKey);
  console.log(`User eth address: ${userEthAddress}`);
  console.log(`Total locked ${utils.satoshiToDoge(valueLocked)} doges`);

  console.log("Lock Done.");
}

function createSendTx(
  destinationAddress,
  lockAmount,
  { txid, index: outputIndex, value: utxoAmount },
  signer,
  network,
  fee = 0 //10 ** 8
) {
  const chainParams = getDogecoinParams(network);
  const signerAddress = dogeAddressFromKeyPair(signer, network);
  if (utxoAmount < lockAmount + fee) {
    // TODO: show in doge units instead of satoshis?
    throw new Error(`The UTXO specified doesn't have enough doges.
  The amount to lock is: ${lockAmount}
  The fee is: ${fee}
  The UTXO has value: ${utxoAmount}`);
  }

  const result = {};

  const txBuilder = new bitcoinjsLib.TransactionBuilder(chainParams);
  txBuilder.setVersion(1);
  txBuilder.addInput(txid, outputIndex);
  txBuilder.addOutput(destinationAddress, lockAmount);
  const changeUtxoAmount = utxoAmount - lockAmount - fee;
  if (changeUtxoAmount > 0) {
    txBuilder.addOutput(signerAddress, changeUtxoAmount);
  }
  txBuilder.sign(0, signer);

  result.signedTx = txBuilder.build();
  if (changeUtxoAmount > 0) {
    // Add change utxo for later use
    result.changeUtxo = {
      txid: result.signedTx.getId(),
      index: 1,
      value: changeUtxoAmount,
    };
  }

  return result;
}

function invokeDogecoinRpc(dogecoinRpc, dogecoinRpcFunctionName, ...rpcParams) {
  const dogecoinRpcFunction = dogecoinRpc[dogecoinRpcFunctionName];
  return new Promise((resolve, reject) => {
    rpcParams.push((err, ret) => {
      if (err) {
        console.error(`Dogecoin RPC error: ${JSON.stringify(err)}`);
        reject(err);
        return;
      }
      resolve(ret);
    });
    dogecoinRpcFunction.apply(dogecoinRpc, rpcParams);
  });
}

function getDogecoinParams(network) {
  if (network === "mainnet") return DOGECOIN_MAINNET;
  if (network === "testnet") return DOGECOIN_TESTNET;
  if (network === "regtest") return DOGECOIN_REGTEST;
  throw new Error("Unknown network ${network}");
}

function getAddressPrefix(network) {
  return getDogecoinParams(network).pubKeyHash;
}

function dogeKeyPairFromWIF(wif, network) {
  const chainParams = getDogecoinParams(network);
  return bitcoinjsLib.ECPair.fromWIF(wif, chainParams);
}

function dogeAddressFromKeyPair(keyPair, network) {
  const chainParams = getDogecoinParams(network);
  return bitcoinjsLib.payments.p2pkh({
    pubkey: keyPair.publicKey,
    network: chainParams,
  }).address;
}

doIt()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(`Unhandled failure.
${error.stack || error}`);
    process.exit(1);
  });
