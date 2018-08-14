var utils = require('../utils');
var yargs = require('yargs');

async function doIt() {
  var argv = utils.completeYargs(yargs
      .option('s', {
        group: 'Data:',
        alias: 'sender',
        describe: 'from eth address',
        demandOption: true
      })
      .option('r', {
        group: 'Data:',
        alias: 'receiver',
        describe: 'to eth address',
        demandOption: true
      })
      .option('v', {
        group: 'Data:',
        alias: 'value',
        describe: 'number of weis to transfer',
        type: 'number',
        demandOption: true
      })
      .usage('Transfers eth from one eth address to another.\nUsage: node user/transfer-eth.js --ethnetwork <eth network> --sender <from eth address> --receiver <to eth address> --value <number of weis>')
      .example('node user/transfer-eth.js --ethnetwork rinkeby --sender 0xd2394f3fad76167e7583a876c292c86ed10305da --receiver 0xd2394f3fad76167e7583a876c292c86ed1ffffff --value 10000000000000000')      
    ).argv;

  var initObjects = utils.init(argv);
  var web3 = initObjects.web3;
  web3.eth.getTransactionReceiptMined = require("../getTransactionReceiptMined");
  var DogeToken = initObjects.DogeToken;

  var sender = argv.sender;
  var receiver = argv.receiver;
  var value = argv.value;

  console.log("Transfer " + web3.fromWei(value) + " eth from " + sender + " to " + receiver);

  // Do some checks
  if (!await utils.doSomeChecks(web3, sender)) {
    return;
  }
  if(!(value > 0)) {
    console.log("Value should be greater than 0");
    return;
  }

  // Do transfer  
  var senderEthBalance = await web3.eth.getBalance(sender);     
  //console.log("Sender eth balance : " + web3.fromWei(senderEthBalance.toNumber()));
  var receiverEthBalance = await web3.eth.getBalance(receiver);     
  console.log("Receiver balance : " + web3.fromWei(receiverEthBalance.toNumber()) + " eth.");
  console.log("Sending transaction...");  
  var txHash = await web3.eth.sendTransaction({from: sender, to: receiver, value: value});  
  console.log("Transaction sent.");  
  console.log("Waiting transaction to be included in a block...");  
  await web3.eth.getTransactionReceiptMined(txHash);
  console.log("Transaction included in a block.");  
  var senderEthBalance = await web3.eth.getBalance(sender);     
  console.log("Sender balance : " + web3.fromWei(senderEthBalance.toNumber()) + " eth.");
  var receiverEthBalance = await web3.eth.getBalance(receiver);     
  console.log("Receiver balance : " + web3.fromWei(receiverEthBalance.toNumber()) + " eth.");
  console.log("Transfer eth completed.");  
}

doIt();