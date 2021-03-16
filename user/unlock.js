"use strict";

const utils = require("../utils");
const yargs = require("yargs");
const bitcoreLib = require("bitcore-lib");


/**
 * This implements the user "crossing" the bridge from ethereum to dogecoin.
 * The user redeems an amount of doge tokens with one or more operators to get
 * an equivalent amount of dogecoin in the dogecoin network.
 *
 * @dev Note that this is a naive implementation. It eagerly redeems doge tokens
 * with the first operator in the doge token contract and proceeds to the
 * next operator if the requested amount was not reached.
 */
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
        type: "string",
        describe: "doge destination address",
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
        `Converts doge tokens on the eth blockchain to doges on the dogecoin blockchain.
Usage: node user/unlock.js --privateKey <sender eth private key> --receiver <to doge address> --value <number of tokens>`
      )
      .example(
        "node user/unlock.js --privateKey 0xf968fec769bdd389e33755d6b8a704c04e3ab958f99cc6a8b2bcf467807f9634 --receiver ncbC7ZY1K9EcMVjvwbgSBWKQ4bwDWS4d5P --value 300000000",
        "Send 3 doge tokens to unlock 3 dogecoins and send them to ncbC7ZY1K9EcMVjvwbgSBWKQ4bwDWS4d5P."
      )
  ).argv;

  const { web3, dogeToken } = utils.init(argv);

  const {
    privateKey,
    receiver: dogeDestinationAddress,
    value: valueToUnlock,
    gasPrice
  } = argv;

  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(account);
  const sender = account.address;

  // Check address validity
  let decodedDogeAddress;
  try {
    decodedDogeAddress = bitcoreLib.encoding.Base58Check.decode(
      dogeDestinationAddress
    );
  } catch (err) {
    throw new Error(`Bad Doge destination address.
Decoder error: ${err.message}`);
  }
  // Check if address version is valid for Dogecoin
  // if (
  //   !(
  //     dogeDestinationAddress[0] == "D" &&
  //     /[ABCDEFGHJKLMNPQRSTUVWXYZ123456789]/.test(dogeDestinationAddress[1])
  //   )
  // ) {
  //   throw new Error("Bad Doge version in destination address");
  // }

  console.log(
    `Unlock ${utils.satoshiToDoge(
      valueToUnlock
    )} doge tokens from ${sender} to ${dogeDestinationAddress}.`
  );

  // Do some checks
  await utils.doSomeChecks(web3, sender);
  if (!(valueToUnlock > 0)) {
    throw new Error("Value should be greater than 0");
  }

  await utils.printDogeTokenBalances(dogeToken, sender);
  const senderDogeTokenBalance = await dogeToken.balanceOf.call(sender);
  if (valueToUnlock > senderDogeTokenBalance.toNumber()) {
    throw new Error("Sender doge token balance is not enough.");
  }

  // Do unlock
  console.log("Initiating unlock... ");
  let minUnlockValue = await dogeToken.MIN_UNLOCK_VALUE();
  minUnlockValue = minUnlockValue.toNumber();
  if (valueToUnlock < minUnlockValue) {
    throw new Error(
      `Value to unlock ${valueToUnlock} should be at least ${minUnlockValue}`
    );
  }
  const operatorsLength = await dogeToken.getOperatorsLength();
  let valueUnlocked = 0;
  for (let i = 0; i < operatorsLength; i++) {
    const [operatorPublicKeyHash, deleted] = await dogeToken.operatorKeys(i);
    if (deleted === false) {
      // not deleted
      const operator = await dogeToken.operators(operatorPublicKeyHash);
      const dogeAvailableBalance = operator[1].toNumber();
      if (dogeAvailableBalance >= minUnlockValue) {
        // dogeAvailableBalance >= MIN_UNLOCK_VALUE
        // TODO: what if valueToUnlockWithThisOperator < minUnlockValue?
        const valueToUnlockWithThisOperator = Math.min(
          valueToUnlock - valueUnlocked,
          dogeAvailableBalance
        );
        console.log(
          `Unlocking ${utils.satoshiToDoge(
            valueToUnlockWithThisOperator
          )} doge tokens using operator ${operatorPublicKeyHash}`
        );

        // Format address as bytes20 for contracts
        decodedDogeAddress =
          "0x" + decodedDogeAddress.toString("hex").slice(2, 42);
        const unlockTxReceipt = await dogeToken.doUnlock(
          decodedDogeAddress,
          valueToUnlockWithThisOperator,
          operatorPublicKeyHash,
          { from: sender, gas: 500000, gasPrice }
        );
        utils.printTxResult(unlockTxReceipt, "Unlock");
        if (
          !(
            unlockTxReceipt.logs.length === 1 &&
            unlockTxReceipt.logs[0].event === "ErrorDogeToken"
          )
        ) {
          // unlock succeeded
          valueUnlocked += valueToUnlockWithThisOperator;
        }
      }
    }
    if (valueUnlocked == valueToUnlock) {
      break;
    }
  }
  console.log(
    `Total unlocked ${utils.satoshiToDoge(
      valueUnlocked
    )} doge tokens from address ${sender}`
  );

  console.log("Unlock done.");
  await utils.printDogeTokenBalances(dogeToken, sender);
}

doIt();
