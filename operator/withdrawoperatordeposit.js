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
      .option("v", {
        group: "Data:",
        alias: "value",
        describe: "number of weis to withdraw",
        type: "number",
        demandOption: true,
      })
      .option("pk", {
        group: "Data:",
        alias: "privateKey",
        describe: "private key used to sign the transaction",
        demandOption: true,
      })
      .usage(
        `Transfers eth from the DogeToken contract to the operator account.
Usage: node operator/withdrawoperatordeposit.js --operatorPublicKeyHash <operator public key hash> --value <number of weis to withdraw> --privateKey <operator eth private key>`
      )
      .example(
        "node operator/withdrawoperatordeposit.js --operatorPublicKeyHash 0x03cd041b0139d3240607b9fd1b2d1b691e22b5d6 --value 1000000000000000000 --privateKey 0xf968fec769bdd389e33755d6b8a704c04e3ab958f99cc6a8b2bcf467807f9634",
        "Withdraw 1 ETH from the deposit in DogeToken by the account that corresponds to private key 0xf968fec769bdd389e33755d6b8a704c04e3ab958f99cc6a8b2bcf467807f9634"
      )
  ).argv;

  const { provider, dogeToken } = await utils.init(argv);

  const operatorPublicKeyHash = argv.operatorPublicKeyHash;
  const value = argv.value;

  const operatorSigner = new ethers.Wallet(argv.privateKey, provider);

  const operatorDogeToken = dogeToken.connect(operatorSigner);

  console.log(
    `Withdraw operator deposit with public key hash ${operatorPublicKeyHash}, value ${ethers.utils.formatEther(
      value
    )} eth and eth address ${operatorSigner.address}`
  );

  await utils.checkSignerBalance(operatorSigner);
  if (!(value > 0)) {
    throw new Error("Value to withdraw should be greater than 0.");
  }

  // TODO: provide some checks for the value that is to be withdrawn here before sending the transaction?
  await printOperatorDeposit(dogeToken, operatorPublicKeyHash);

  // Withdraw operator deposit
  console.log("Withdrawing operator deposit...");
  const withdrawOperatorDepositTxReceipt =
    await operatorDogeToken.withdrawOperatorDeposit(
      operatorPublicKeyHash,
      value,
      { gasLimit: 50000, gasPrice: argv.gasPrice }
    );
  utils.printTxResult(
    withdrawOperatorDepositTxReceipt,
    "Withdraw operator deposit"
  );

  await printOperatorDeposit(dogeToken, operatorPublicKeyHash);
}

async function printOperatorDeposit(dogeToken, operatorPublicKeyHash) {
  const { ethBalance } = await dogeToken.callStatic.operators(
    operatorPublicKeyHash
  );
  console.log(`Operator deposit: ${ethers.utils.formatEther(ethBalance)} eth.`);
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
