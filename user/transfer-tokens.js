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
        describe: 'number of tokens to transfer',
        type: 'number',
        demandOption: true
      })
      .usage('Transfers doge tokens from one user to another.\nUsage: node user/transfer-tokens.js --ethnetwork <eth network> --sender <from eth address> --receiver <to eth address> --value <number of tokens>')
      .example('node user/transfer-tokens.js --ethnetwork ropsten --sender 0xd2394f3fad76167e7583a876c292c86ed10305da --receiver 0xd2394f3fad76167e7583a876c292c86ed1ffffff --value 1')      
    ).argv;

  var initObjects = utils.init(argv);
  var web3 = initObjects.web3;
  var DogeToken = initObjects.DogeToken;

  var sender = argv.sender;
  var receiver = argv.receiver;
  var value = argv.value;

  console.log("Transfer " + utils.satoshiToDoge(value) + " doge tokens from " + sender + " to " + receiver);

  // Do some checks
  if (!await utils.doSomeChecks(web3, sender)) {
    return;
  }
  if(!(value > 0)) {
    console.log("Value should be greater than 0");
    return;
  }

  var dt = await DogeToken.deployed();
  await utils.printDogeTokenBalances(dt, sender, receiver);
  var senderDogeTokenBalance = await dt.balanceOf.call(sender);
  if (value > senderDogeTokenBalance.toNumber()) {
    console.log("Error: Sender doge token balance is not enough.");
    return;
  }     

  // Do transfer  
  console.log("Initiating transfer... ");
  const transferTxReceipt = await dt.transfer(receiver, value, {from: sender, gas: 60000, gasPrice: argv.gasPrice});
  utils.printTxResult(transferTxReceipt, "Transfer");
  await utils.printDogeTokenBalances(dt, sender, receiver);
}

doIt();
