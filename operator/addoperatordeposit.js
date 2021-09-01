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
        describe: "number of weis to deposit",
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
        `Transfers eth from the operator account to the DogeToken contract.
Usage: node operator/addoperatordeposit.js --operatorPublicKeyHash <operator public key hash> --value <number of weis to deposit> --privateKey <operator eth private key>`
      )
      .example(
        "node operator/addoperatordeposit.js --operatorPublicKeyHash 0x03cd041b0139d3240607b9fd1b2d1b691e22b5d6 --value 1000000000000000000 --privateKey 0xf968fec769bdd389e33755d6b8a704c04e3ab958f99cc6a8b2bcf467807f9634",
        "Add 1 ETH to the deposit held by the DogeToken contract for the operator of private key 0xf968fec769bdd389e33755d6b8a704c04e3ab958f99cc6a8b2bcf467807f9634"
      )
  ).argv;

  const { provider, dogeToken } = await utils.init(argv);

  const operatorPublicKeyHash = argv.operatorPublicKeyHash;
  const value = argv.value;

  const operatorSigner = new ethers.Wallet(argv.privateKey, provider);

  const operatorDogeToken = dogeToken.connect(operatorSigner);

  console.log(
    `Add operator deposit with public key hash ${operatorPublicKeyHash}, value ${ethers.utils.formatEther(
      value
    )} eth and eth address ${operatorSigner.address}`
  );

  // Do some checks
  await utils.checkSignerBalance(operatorSigner);

  if (!(value > 0)) {
    // TODO: throw an error instead?
    console.error("Value to deposit should be greater than 0.");
    return;
  }

  await printOperatorDeposit(
    dogeToken,
    operatorPublicKeyHash,
    "Current operator deposit"
  );

  // Add operator deposit
  console.log("Adding operator deposit...");
  // TODO: check gas costs
  const addOperatorDepositTx = await operatorDogeToken.addOperatorDeposit(
    operatorPublicKeyHash,
    {
      value,
      gasLimit: 50000,
      gasPrice: argv.gasPrice,
    }
  );
  const addOperatorDepositTxReceipt = await addOperatorDepositTx.wait();
  utils.printTxResult(addOperatorDepositTxReceipt, "Add operator deposit");

  await printOperatorDeposit(
    dogeToken,
    operatorPublicKeyHash,
    "Updated operator deposit"
  );
}

async function printOperatorDeposit(dogeToken, operatorPublicKeyHash, label) {
  const { ethBalance } = await dogeToken.callStatic.operators(
    operatorPublicKeyHash
  );
  console.log(`${label}: ${ethers.utils.formatEther(ethBalance)} eth.`);
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
