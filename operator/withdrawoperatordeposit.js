var utils = require('../utils');
var yargs = require('yargs');

async function doIt() {
  var argv = utils.completeYargs(yargs
      .option('o', {
        group: 'Data:',
        alias: 'operatorPublicKeyHash',
        describe: 'operator public key hash',
        demandOption: true
      })
      .option('v', {
        group: 'Data:',
        alias: 'value',
        describe: 'number of weis to withdraw',
        type: 'number',
        demandOption: true
      })
      .option('a', {
        group: 'Data:',
        alias: 'ethAddress',
        describe: 'operator eth address',
        demandOption: true
      })
      .usage('node operator/withdrawoperatordeposit.js --network <eth network> --operatorPublicKeyHash <operator public key hash> --value <number of weis to withdraw> --ethAddress <operator eth address>')
      .example('node operator/withdrawoperatordeposit.js --network ropsten --operatorPublicKeyHash 0x03cd041b0139d3240607b9fd1b2d1b691e22b5d6 --value 1000000000000000000 --ethAddress 0xd2394f3fad76167e7583a876c292c86ed1ffffff')
    ).argv;

  var initObjects = utils.init(argv);
  var web3 = initObjects.web3;
  var DogeToken = initObjects.DogeToken;

  var operatorPublicKeyHash = argv.operatorPublicKeyHash;
  var value = argv.value;
  var operatorEthAddress = argv.ethAddress;

  console.log("Withdraw operator deposit with public key hash " + operatorPublicKeyHash + ", value " + web3.fromWei(value) + " eth and eth address " + operatorEthAddress);

  // Do some checks
  if (!await utils.doSomeChecks(web3, operatorEthAddress)) {
    return;
  }
  if(!(value > 0)) {
    console.log("Value should be greater than 0");
    return;
  }

  var dt = await DogeToken.deployed();

  await printOperatorDeposit(web3, dt, operatorPublicKeyHash);

  // Withdraw operator deposit
  console.log("Withdrawing operator deposit... ");
  var dt = await DogeToken.deployed();
  const withdrawOperatorDepositTxReceipt = await dt.withdrawOperatorDeposit(operatorPublicKeyHash, value, {from : operatorEthAddress, gas: 50000, gasPrice: argv.gasPrice});
  utils.printTxResult(withdrawOperatorDepositTxReceipt, "Withdraw operator deposit");

  await printOperatorDeposit(web3, dt, operatorPublicKeyHash);
}

async function printOperatorDeposit(web3, dt, operatorPublicKeyHash) {
  var operator = await dt.operators.call(operatorPublicKeyHash);     
  console.log("Operator deposit : " + web3.fromWei(operator[4].toNumber())  + " eth.");       
}



doIt();
