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

  const { web3, dogeToken } = await utils.init(argv);

  const operatorPublicKeyHash = argv.operatorPublicKeyHash;
  const value = argv.value;
  const privateKey = argv.privateKey;

  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(account);
  const operatorEthAddress = account.address;

  console.log(
    `Withdraw operator deposit with public key hash ${operatorPublicKeyHash}, value ${web3.utils.fromWei(
      value
    )} eth and eth address ${operatorEthAddress}`
  );

  // Do some checks
  await utils.doSomeChecks(web3, operatorEthAddress);
  if (!(value > 0)) {
    throw new Error("Value should be greater than 0");
  }

  // TODO: provide some checks for the value that is to be withdrawn here before sending the transaction?
  await printOperatorDeposit(web3, dogeToken, operatorPublicKeyHash);

  // Withdraw operator deposit
  console.log("Withdrawing operator deposit...");
  const withdrawOperatorDepositTxReceipt = await dogeToken.withdrawOperatorDeposit(
    operatorPublicKeyHash,
    value,
    { from: operatorEthAddress, gas: 50000, gasPrice: argv.gasPrice }
  );
  utils.printTxResult(
    withdrawOperatorDepositTxReceipt,
    "Withdraw operator deposit"
  );

  await printOperatorDeposit(web3, dogeToken, operatorPublicKeyHash);
}

async function printOperatorDeposit(web3, dogeToken, operatorPublicKeyHash) {
  const operator = await dogeToken.operators.call(operatorPublicKeyHash);
  console.log(`Operator deposit: ${web3.utils.fromWei(operator[4])} eth.`);
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
