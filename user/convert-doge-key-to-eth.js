"use strict";

const utils = require("../utils");
const yargs = require("yargs");
const Web3 = require("web3");

const { keyDogeToEthInBytes } = require("./formatconverter");

async function doIt() {
  const argv = utils.completeYargs(
    yargs
      .option("dk", {
        group: "Data:",
        alias: "dogePrivateKey",
        describe: "private key in dogecoin format",
        demandOption: true,
        type: "string",
      })
      .usage(
        `Converts a private key in dogecoin format to the standard ethereum format.
Usage: node user/convert-doge-key-to-eth.js --dogePrivateKey <private key in eth format>`
      )
      .example(
        "node user/convert-doge-key-to-eth.js --dogePrivateKey Kdef456def456def456def456def456def456def456def456def",
        "Converts the Kdef456def456def456def456def456def456def456def456def dogecoin key to an ethereum key."
      )
  ).argv;

  const web3 = new Web3();

  const dogePrivateKey = argv.dogePrivateKey;
  const privateKey = `0x${keyDogeToEthInBytes(dogePrivateKey).toString("hex")}`;

  const account = web3.eth.accounts.privateKeyToAccount(privateKey);

  console.log(`Got key for Ethereum address ${account.address}.
Ethereum private key: ${privateKey}`);
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
