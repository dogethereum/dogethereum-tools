"use strict";

const ethers = require("ethers");
const yargs = require("yargs");

const utils = require("../utils");

async function doIt() {
  const argv = utils.completeYargs(
    yargs
      .option("o", {
        group: "Data:",
        alias: "operatorPublicKeyHash",
        describe: "operator public key hash",
        demandOption: true,
      })
      .usage(
        `Prints operator status.
Usage: node operator/print-status.js --operatorPublicKeyHash <operator public key hash>`
      )
      .example(
        "node operator/print-status.js --operatorPublicKeyHash 0x03cd041b0139d3240607b9fd1b2d1b691e22b5d6",
        "Show the status of operator 0x03cd041b0139d3240607b9fd1b2d1b691e22b5d6"
      )
  ).argv;

  const { dogeToken } = await utils.init(argv);

  const operatorPublicKeyHash = argv.operatorPublicKeyHash;

  console.log(
    `Print operator status for operator with public key hash ${operatorPublicKeyHash}`
  );

  const {
    ethAddress,
    dogeAvailableBalance,
    dogePendingBalance,
    ethBalance,
    operatorKeyIndex,
  } = await dogeToken.callStatic.operators(operatorPublicKeyHash);
  console.log(`Eth Address: ${ethAddress}`);
  console.log(
    `Doge available balance: ${utils.satoshiToDoge(
      dogeAvailableBalance
    )} doges.`
  );
  console.log(
    `Doge pending balance: ${utils.satoshiToDoge(dogePendingBalance)} doges.`
  );
  console.log(`Deposit: ${ethers.utils.formatEther(ethBalance)} eth.`);

  const { deleted } = await dogeToken.callStatic.operatorKeys(operatorKeyIndex);
  console.log(`Active: ${deleted === false}`);
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
