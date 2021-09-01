"use strict";

const ethers = require("ethers");
const yargs = require("yargs");

const utils = require("../utils");

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

  const { provider } = await utils.init(argv);

  const signer = new ethers.Wallet(argv.privateKey, provider);

  const receiver = argv.receiver;
  const value = argv.value;

  console.log(
    `Transfer ${ethers.utils.formatEther(value)} eth from ${
      signer.address
    } to ${receiver}`
  );

  // Do some checks
  await utils.checkSignerBalance(signer);
  if (!(value > 0)) {
    throw new Error("Value to transfer should be greater than 0.");
  }

  // Do transfer
  let senderEthBalance = await signer.getBalance();
  // console.log(`Sender eth balance: ${ethers.utils.formatEther(senderEthBalance)}`);
  let receiverEthBalance = await provider.getBalance(receiver);
  console.log(
    `Receiver balance: ${ethers.utils.formatEther(receiverEthBalance)} eth.`
  );
  console.log("Sending transaction...");
  await signer.sendTransaction({
    to: receiver,
    value,
  });
  console.log("Transaction sent.");
  senderEthBalance = await signer.getBalance();
  console.log(
    `Sender balance: ${ethers.utils.formatEther(senderEthBalance)} eth.`
  );
  receiverEthBalance = await provider.getBalance(receiver);
  console.log(
    `Receiver balance: ${ethers.utils.formatEther(receiverEthBalance)} eth.`
  );
  console.log("Transfer eth completed.");
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
