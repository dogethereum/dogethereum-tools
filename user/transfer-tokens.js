"use strict";

const utils = require("../utils");
const yargs = require("yargs");

async function doIt() {
  const argv = utils.completeYargs(
    yargs
      .option("s", {
        group: "Data:",
        alias: "sender",
        describe: "from eth address",
        demandOption: true,
      })
      .option("r", {
        group: "Data:",
        alias: "receiver",
        describe: "to eth address",
        demandOption: true,
      })
      .option("v", {
        group: "Data:",
        alias: "value",
        describe: "number of tokens to transfer",
        type: "number",
        demandOption: true,
      })
      .usage(
        `Transfers doge tokens from one user to another.
Usage: node user/transfer-tokens.js --ethnetwork <eth network> --sender <from eth address> --receiver <to eth address> --value <number of tokens>`
      )
      .example(
        "node user/transfer-tokens.js --ethnetwork rinkeby --sender 0xd2394f3fad76167e7583a876c292c86ed10305da --receiver 0xd2394f3fad76167e7583a876c292c86ed1ffffff --value 1"
      )
  ).argv;

  const { web3, dogeToken } = utils.init(argv);

  const sender = argv.sender;
  const receiver = argv.receiver;
  const value = argv.value;

  console.log(
    `Transfer ${utils.satoshiToDoge(
      value
    )} doge tokens from ${sender} to ${receiver}`
  );

  // Do some checks
  await utils.doSomeChecks(web3, sender);
  if (!(value > 0)) {
    throw new Error("Value should be greater than 0");
  }

  await utils.printDogeTokenBalances(dogeToken, sender, receiver);
  const senderDogeTokenBalance = await dogeToken.balanceOf.call(sender);
  if (value > senderDogeTokenBalance.toNumber()) {
    throw new Error("Sender doge token balance is not enough.");
  }

  // Do transfer
  console.log("Initiating transfer... ");
  const transferTxReceipt = await dogeToken.transfer(receiver, value, {
    from: sender,
    gas: 60000,
    gasPrice: argv.gasPrice,
  });
  utils.printTxResult(transferTxReceipt, "Transfer");
  await utils.printDogeTokenBalances(dogeToken, sender, receiver);
}

doIt();
