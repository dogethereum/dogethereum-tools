"use strict";

const utils = require("../utils");
const yargs = require("yargs");

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
Usage: node user/print-balances.js --ethnetwork <eth network> --address <eth address>`
      )
      .example(
        "node user/print-balances.js --ethnetwork rinkeby --address 0xd2394f3fad76167e7583a876c292c86ed1ffffff"
      )
  ).argv;

  const { web3, dogeToken } = utils.init(argv);

  const address = argv.address;

  console.log(`Print eth and doge token balances for eth address ${address}`);

  // Do some checks
  await utils.doSomeChecks(web3);

  const ethBalance = await web3.eth.getBalance(address);
  console.log(`Eth balance: ${web3.fromWei(ethBalance.toNumber())} eth.`);
  const dogeTokenBalance = await dogeToken.balanceOf.call(address);
  console.log(
    `Doge token balance: ${utils.satoshiToDoge(
      dogeTokenBalance.toNumber()
    )} doge tokens.`
  );
}

doIt();
