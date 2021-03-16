var utils = require('../utils');
var yargs = require('yargs');
var bitcoreLib = require('bitcore-lib');

async function doIt() {
  var argv = utils.completeYargs(yargs
      .option('s', {
        group: 'Data:',
        alias: 'sender',
        describe: 'from eth account',
        demandOption: true
      })
      .option('r', {
        group: 'Data:',
        alias: 'receiver',
        describe: 'doge destination address',
        demandOption: true
      })
      .option('v', {
        group: 'Data:',
        alias: 'value',
        describe: 'number of tokens to transfer',
        type: 'number',
        demandOption: true
      })
      .usage('Converts doge tokens on the eth blockchain to doges on the dogecoin blockchain.\nUsage: node user/unlock.js --ethnetwork <eth network> --sender <from eth account> --receiver <to doge address> --value <number of tokens>')
      .example('node user/unlock.js --ethnetwork rinkeby --sender 0xd2394f3fad76167e7583a876c292c86ed10305da --receiver ncbC7ZY1K9EcMVjvwbgSBWKQ4bwDWS4d5P --value 300000000')
    ).argv;

  var initObjects = utils.init(argv);
  var web3 = initObjects.web3;
  var DogeToken = initObjects.DogeToken;

  var sender = argv.sender;
  var dogeDestinationAddress = argv.receiver;
  var valueToUnlock = argv.value;


  // Check address validity
  let decodedDogeAddress;
  try {
    decodedDogeAddress = bitcoreLib.encoding.Base58Check.decode(dogeDestinationAddress);
  } catch(err) {
    console.log("Error: Bad Doge destination address");
    return false;
  }  
  // Check if address version is valid for Dogecoin
  // if (!(dogeDestinationAddress[0] == 'D' && /[ABCDEFGHJKLMNPQRSTUVWXYZ123456789]/.test(dogeDestinationAddress[1]))) {
  //   console.log("Error: Bad Doge destination address version");
  //   return false;
  // }

  console.log("Unlock " + utils.satoshiToDoge(valueToUnlock) + " doge tokens from " + sender + " to " + dogeDestinationAddress + ".");

  // Do some checks
  if (!await utils.doSomeChecks(web3, sender)) {
    return;
  }
  if(!(valueToUnlock > 0)) {
    console.log("Value should be greater than 0");
    return;
  }


  var dt = await DogeToken.deployed();
  await utils.printDogeTokenBalances(dt, sender);
  var senderDogeTokenBalance = await dt.balanceOf.call(sender);
  if (valueToUnlock > senderDogeTokenBalance.toNumber()) {
    console.log("Error: Sender doge token balance is not enough.");
    return;
  }

  // Do unlock
  console.log("Initiating unlock... ");
  var minUnlockValue = await dt.MIN_UNLOCK_VALUE();
  minUnlockValue = minUnlockValue.toNumber();
  if(valueToUnlock < minUnlockValue) {
    console.log("Value to unlock " + valueToUnlock + " should be at least " + minUnlockValue);
    return false;
  }
  const operatorsLength = await dt.getOperatorsLength();
  var valueUnlocked = 0;
  for (var i = 0; i < operatorsLength; i++) {
    let operatorKey = await dt.operatorKeys(i);
    if (operatorKey[1] == false) {
      // not deleted
      let operatorPublicKeyHash = operatorKey[0];
      let operator = await dt.operators(operatorPublicKeyHash);
      var dogeAvailableBalance = operator[1].toNumber();
      if (dogeAvailableBalance >= minUnlockValue) {
        // dogeAvailableBalance >= MIN_UNLOCK_VALUE  
        var valueToUnlockWithThisOperator = Math.min(valueToUnlock - valueUnlocked, dogeAvailableBalance);
        console.log("Unlocking " + utils.satoshiToDoge(valueToUnlockWithThisOperator) + " doge tokens using operator " + operatorPublicKeyHash);

        // Format address as bytes20 for contracts
        decodedDogeAddress = "0x" + decodedDogeAddress.toString('hex').slice(2, 42);
        const unlockTxReceipt = await dt.doUnlock(decodedDogeAddress, valueToUnlockWithThisOperator,
            operatorPublicKeyHash, {from: sender, gas: 500000, gasPrice: argv.gasPrice});
        utils.printTxResult(unlockTxReceipt, "Unlock");
        if (!(unlockTxReceipt.logs.length == 1 && unlockTxReceipt.logs[0].event == "ErrorDogeToken")) {
          // unlock succeded
          valueUnlocked += valueToUnlockWithThisOperator;
        }
      }
    }
    if (valueUnlocked == valueToUnlock) {
      break;
    }
  }
  console.log("Total unlocked " + utils.satoshiToDoge(valueUnlocked) + " doge tokens from address " + sender);

  console.log("Unlock done.");
  await utils.printDogeTokenBalances(dt, sender);
}

doIt();

