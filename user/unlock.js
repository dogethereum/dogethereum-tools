var process = require('process');
var Web3 = require('web3');
var contract = require("truffle-contract");
var path = require('path');
const fs = require('fs');
var utils = require('./utils');

var provider = new Web3.providers.HttpProvider("http://localhost:8545");
var web3 = new Web3(provider);
const DogeTokenJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../dogerelay/build/contracts/DogeToken.json')));
const DogeToken = contract(DogeTokenJson);
DogeToken.setNetwork('32000'); // integrationDogeRegtest
DogeToken.setProvider(provider);


async function doIt() {
  var argv = process.argv;
  var sender = utils.getCliParam(argv, 0);
  var dogeDestinationAddress = utils.getCliParam(argv, 1); // Something like "ncbC7ZY1K9EcMVjvwbgSBWKQ4bwDWS4d5P"
  var valueToUnlock = utils.getCliParam(argv, 2);

  console.log("Unlock " + utils.dogeToSatoshi(valueToUnlock) + " doge tokens from " + sender + " to " + dogeDestinationAddress + ".");

  // Do some checks
  if (!await utils.doSomeChecks(web3, sender, valueToUnlock)) {
    return;
  }

  var dt = await DogeToken.deployed();
  await utils.printDogeTokenBalances(dt, sender);
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
        console.log("Unlocking " + valueToUnlockWithThisOperator + " DogeTokens using operator " + operatorPublicKeyHash);     
        await dt.doUnlock(dogeDestinationAddress, valueToUnlock, operatorPublicKeyHash, {from: sender, gas: 350000});
        valueUnlocked += valueToUnlockWithThisOperator;
      }
    }
    if (valueUnlocked == valueToUnlock) {
      break;
    }
  }
  console.log("Total unlocked " + valueUnlocked + " DogeTokens from " + sender);    

  console.log("Unlock Done.");
  await utils.printDogeTokenBalances(dt, sender);
}

doIt();

