"use strict";

const utils = require("../utils");
const yargs = require("yargs");

async function doIt() {
  const argv = utils.completeYargs(
    yargs
      .option("pk", {
        group: "Data:",
        alias: "privateKey",
        type: "string",
        describe: "private key used to sign the transaction",
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
Usage: node user/transfer-eth.js --privateKey <sender eth private key> --receiver <to eth address> --value <number of weis>`
      )
      .example(
        "node user/transfer-eth.js --privateKey 0xf968fec769bdd389e33755d6b8a704c04e3ab958f99cc6a8b2bcf467807f9634 --receiver 0xd2394f3fad76167e7583a876c292c86ed1ffffff --value 10000000000000000",
        "Send 0.01 ETH to 0xd2394f3fad76167e7583a876c292c86ed1ffffff"
      )
  ).argv;

  const { web3 } = await utils.init(argv);

  const privateKey = argv.privateKey;
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(account);
  const sender = account.address;

  const receiver = argv.receiver;
  const value = argv.value;

  console.log(
    `Transfer ${web3.utils.fromWei(value)} eth from ${sender} to ${receiver}`
  );

  // Do some checks
  await utils.doSomeChecks(web3, sender);
  if (!(value > 0)) {
    throw new Error("Value should be greater than 0");
  }

  // Do transfer
  let senderEthBalance = await web3.eth.getBalance(sender);
  // console.log(`Sender eth balance: ${web3.utils.fromWei(senderEthBalance)}`);
  let receiverEthBalance = await web3.eth.getBalance(receiver);
  console.log(
    `Receiver balance: ${web3.utils.fromWei(receiverEthBalance)} eth.`
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
    `Sender balance: ${web3.utils.fromWei(senderEthBalance)} eth.`
  );
  receiverEthBalance = await web3.eth.getBalance(receiver);
  console.log(
    `Receiver balance: ${web3.utils.fromWei(receiverEthBalance)} eth.`
  );
  console.log("Transfer eth completed.");
}

doIt().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error(`Unhandled failure.
${error.stack || error}`);
  process.exit(1);
});
