var utils = require('./utils');
var yargs = require('yargs');

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
        describe: 'to eth account',
        demandOption: true
      })
      .option('v', {
        group: 'Data:',
        alias: 'value',
        describe: 'number of tokens to transfer',
        type: 'number',
        demandOption: true
      })
      .usage('node user/transfer.js --network <eth network> --sender <from eth account> --receiver <to eth account> --value <number of tokens>')
      .example('node user/transfer.js --network ropsten --sender 0xd2394f3fad76167e7583a876c292c86ed10305da --receiver 0xd2394f3fad76167e7583a876c292c86ed1ffffff --value 1')      
    ).argv;

  var initObjects = utils.init(argv);
  var web3 = initObjects.web3;
  var DogeToken = initObjects.DogeToken;

  var sender = argv.sender;
  var receiver = argv.receiver;
  var value = argv.value;

  console.log("Transfer " + utils.dogeToSatoshi(value) + " doge tokens from " + sender + " to " + receiver);

  // Do some checks
  if (!await utils.doSomeChecks(web3, sender, value)) {
    return;
  }

  var dt = await DogeToken.deployed();
  await utils.printDogeTokenBalances(dt, sender, receiver);
  // Do transfer  
  console.log("Initiating transfer... ");
  await dt.transfer(receiver, value, {from: sender, gas: 50000, gasPrice: argv.gasPrice});     
  console.log("Transfer Done.");
  await utils.printDogeTokenBalances(dt, sender, receiver);
}

doIt();
