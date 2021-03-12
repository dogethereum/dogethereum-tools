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
        describe: "number of weis to transfer",
        type: "number",
        demandOption: true,
      })
      .usage(
        `Transfers eth from one eth address to another.
Usage: node user/transfer-eth.js --ethnetwork <eth network> --sender <from eth address> --receiver <to eth address> --value <number of weis>`
      )
      .example(
        "node user/transfer-eth.js --ethnetwork rinkeby --sender 0xd2394f3fad76167e7583a876c292c86ed10305da --receiver 0xd2394f3fad76167e7583a876c292c86ed1ffffff --value 10000000000000000"
      )
  ).argv;

  const { web3 } = utils.init(argv);

  const sender = argv.sender;
  const receiver = argv.receiver;
  const value = argv.value;

  console.log(
    `Transfer ${web3.fromWei(value)} eth from ${sender} to ${receiver}`
  );

  // Do some checks
  await utils.doSomeChecks(web3, sender);
  if (!(value > 0)) {
    throw new Error("Value should be greater than 0");
  }

  // Do transfer
  let senderEthBalance = await web3.eth.getBalance(sender);
  // console.log(`Sender eth balance: ${web3.fromWei(senderEthBalance.toNumber())}`);
  let receiverEthBalance = await web3.eth.getBalance(receiver);
  console.log(
    `Receiver balance: ${web3.fromWei(receiverEthBalance.toNumber())} eth.`
  );
  console.log("Sending transaction...");
  await web3.eth.sendTransaction({
    from: sender,
    to: receiver,
    value: value,
  });
  console.log("Transaction sent.");
  senderEthBalance = await web3.eth.getBalance(sender);
  console.log(
    `Sender balance: ${web3.fromWei(senderEthBalance.toNumber())} eth.`
  );
  receiverEthBalance = await web3.eth.getBalance(receiver);
  console.log(
    `Receiver balance: ${web3.fromWei(receiverEthBalance.toNumber())} eth.`
  );
  console.log("Transfer eth completed.");
}

doIt();
