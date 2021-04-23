"use strict";

const yargs = require("yargs");
const BitcoindRpc = require("bitcoind-rpc");

/**
 * Sends an amount of dogecoin to an address using the wallet in the node.
 */
async function doIt() {
  const argv = yargs
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
    .option("d", {
      group: "Data:",
      alias: "destination",
      describe: "dogecoin address that should receive doges",
      type: "string",
      demandOption: true,
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
    .example(
      "node user/lock.js --value 200000000",
      "Lock 2 doges to get 2 doge tokens (minus fees) in the ethereum network"
    ).argv;

  const dogeRpcConfig = {
    protocol: "http",
    user: argv.dogeuser,
    pass: argv.dogepassword,
    host: argv.dogehost,
    port: argv.dogeport,
  };

  const { destination, value } = argv;

  const dogecoinRpc = new BitcoindRpc(dogeRpcConfig);

  if (!(value > 0)) {
    throw new Error("Value should be greater than 0");
  }

  // const unlock = await invokeDogecoinRpc(
  //   dogecoinRpc,
  //   "walletpassphrase",
  //   "",
  //   10
  // );

  const tx = await invokeDogecoinRpc(
    dogecoinRpc,
    "sendtoaddress",
    destination,
    value
  );
  console.log(tx.result);
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

doIt()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(`Unhandled failure.
${error.stack || error}`);
    process.exit(1);
  });
