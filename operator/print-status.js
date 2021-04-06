"use strict";

const utils = require("../utils");
const yargs = require("yargs");

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

  const { web3, dogeToken } = await utils.init(argv);

  const operatorPublicKeyHash = argv.operatorPublicKeyHash;

  console.log(
    `Print operator status for operator with public key hash ${operatorPublicKeyHash}`
  );

  // Do some checks
  await utils.doSomeChecks(web3);

  const operator = await dogeToken.operators.call(operatorPublicKeyHash);
  console.log(`Eth Address: ${operator[0].toString(16)}`);
  console.log(
    `Doge available balance: ${utils.satoshiToDoge(
      operator[1].toNumber()
    )} doges.`
  );
  console.log(
    `Doge pending balance: ${utils.satoshiToDoge(
      operator[2].toNumber()
    )} doges.`
  );
  console.log(`Deposit: ${web3.utils.fromWei(operator[4])} eth.`);
  const operatorKeyIndex = operator[5];
  const operatorKey = await dogeToken.operatorKeys(operatorKeyIndex);
  console.log(`Active: ${operatorKey[1] == false}`);
}

doIt().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error(`Unhandled failure.
${error.stack || error}`);
  process.exit(1);
});
