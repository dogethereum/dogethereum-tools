"use strict";

const utils = require("../utils");
const formatconverter = require("./formatconverter");
const yargs = require("yargs");
const BitcoindRpc = require("bitcoind-rpc");
const bitcoreLib = require("bitcore-lib");

/**
 * This implements the user "crossing" the bridge from dogecoin to ethereum.
 * The user deposits an amount of dogecoin with one or more operators to get
 * an equivalent amount of doge tokens in the ethereum network.
 *
 * @dev Note that this is a naive implementation. It eagerly locks dogecoin
 * with the first operator in the doge token contract and proceeds to the
 * next operator if the requested amount was not reached.
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
      .option("ds", {
        group: "Optional:",
        alias: "dogewalletpassphrase",
        default: "",
        type: "string",
        describe: "passphrase of the dogecoin wallet",
        demandOption: false,
      })
      .option("v", {
        group: "Data:",
        alias: "value",
        describe: "number of doge satoshis to transfer",
        type: "number",
        demandOption: true,
      })
      .usage(
        `Converts doges on the dogecoin blockchain to doge tokens on the eth blockchain.
Usage: node user/lock.js --value <number of doge satoshis>`
      )
      .example("node user/lock.js --value 200000000", "Add ")
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
  let minLockValue = await dogeToken.MIN_LOCK_VALUE();
  minLockValue = minLockValue.toNumber();
  if (valueToLock < minLockValue) {
    throw new Error(
      `Value to lock ${valueToLock} doge satoshis is less than the minimum lock value ${minLockValue} doge satoshis`
    );
  }
  let dogeEthPrice = await dogeToken.dogeEthPrice();
  dogeEthPrice = dogeEthPrice.toNumber();
  let collateralRatio = await dogeToken.collateralRatio();
  collateralRatio = collateralRatio.toNumber();

  const operatorsLength = await dogeToken.getOperatorsLength();
  let valueLocked = 0;
  for (let i = 0; i < operatorsLength; i++) {
    const [operatorPublicKeyHash, deleted] = await dogeToken.operatorKeys(i);
    if (deleted === false) {
      // not deleted
      const operator = await dogeToken.operators(operatorPublicKeyHash);
      const operatorDogeAvailableBalance = operator[1].toNumber();
      const operatorDogePendingBalance = operator[2].toNumber();
      const operatorEthBalance = operator[4].toNumber();

      const operatorReceivableDoges =
        operatorEthBalance / dogeEthPrice / collateralRatio -
        (operatorDogeAvailableBalance + operatorDogePendingBalance);

      if (operatorReceivableDoges >= minLockValue) {
        const valueToLockWithThisOperator = Math.min(
          valueToLock - valueLocked,
          operatorReceivableDoges
        );
        const Base58Check = bitcoreLib.encoding.Base58Check;
        const dogeAddressPrefix = argv.dogenetwork == "mainnet" ? 30 : 113;
        const operatorDogeAddress = Base58Check.encode(
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
        if (argv.dogewalletpassphrase) {
          await invokeDogecoinRpc(
            dogecoinRpc,
            "walletpassphrase",
            argv.dogewalletpassphrase,
            30
          );
        }
        const sendtoaddressResult = await invokeDogecoinRpc(
          dogecoinRpc,
          "sendtoaddress",
          operatorDogeAddress,
          utils.satoshiToDoge(valueToLockWithThisOperator)
        );
        console.log(`Sent doge tx ${sendtoaddressResult.result}`);
        valueLocked += valueToLockWithThisOperator;

        // Get the dogecoin address of the first input
        const lockTxRawJson = await invokeDogecoinRpc(
          dogecoinRpc,
          "getrawtransaction",
          sendtoaddressResult.result
        );
        const lockTxJson = await invokeDogecoinRpc(
          dogecoinRpc,
          "decoderawtransaction",
          lockTxRawJson.result
        );
        const lockFirstInput = lockTxJson.result.vin[0];
        const fundingTxRawJson = await invokeDogecoinRpc(
          dogecoinRpc,
          "getrawtransaction",
          lockFirstInput.txid
        );
        const fundingTxJson = await invokeDogecoinRpc(
          dogecoinRpc,
          "decoderawtransaction",
          fundingTxRawJson.result
        );
        const userDogecoinAddress =
          fundingTxJson.result.vout[lockFirstInput.vout].scriptPubKey
            .addresses[0];

        // Get the private key and eth address for the dogecoin address
        const dumpprivkeyResult = await invokeDogecoinRpc(
          dogecoinRpc,
          "dumpprivkey",
          userDogecoinAddress
        );
        const userPrivKeyInDogeFormat = dumpprivkeyResult.result;
        const userPrivKeyInEthFormat = formatconverter.privKeyToEthFormat(
          userPrivKeyInDogeFormat
        );
        console.log(`User private key: ${userPrivKeyInEthFormat}`);
        const userEthAddress = formatconverter.getEthAddress(
          web3,
          userPrivKeyInDogeFormat
        );
        console.log(`User eth address: ${userEthAddress}`);
      }
    }
    if (valueLocked == valueToLock) {
      break;
    }
  }
  console.log(`Total locked ${utils.satoshiToDoge(valueLocked)} doges`);

  console.log("Lock Done.");
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

doIt();
