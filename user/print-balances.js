"use strict";

const ethers = require("ethers");
const yargs = require("yargs");

const utils = require("../utils");

async function doIt() {
  const argv = utils.completeYargs(
    yargs
      .option("a", {
        group: "Data:",
        alias: "address",
        describe: "eth address",
        demandOption: true,
      })
      .usage(
        `Prints eth and doge token balances of an eth address.
Usage: node user/print-balances.js --address <eth address>`
      )
      .example(
        "node user/print-balances.js --address 0xd2394f3fad76167e7583a876c292c86ed1ffffff"
      )
  ).argv;

  const { provider, dogeToken } = await utils.init(argv);

  const address = argv.address;

  console.log(`Print eth and doge token balances for eth address ${address}`);

  const ethBalance = await provider.getBalance(address);
  console.log(`Eth balance: ${ethers.utils.formatEther(ethBalance)} eth.`);
  const dogeTokenBalance = await dogeToken.callStatic.balanceOf(address);
  console.log(
    `Doge token balance: ${utils.satoshiToDoge(dogeTokenBalance)} doge tokens.`
  );
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
