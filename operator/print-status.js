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
      .usage('Prints operator status.\nUsage: node operator/print-status.js --ethnetwork <eth network> --operatorPublicKeyHash <operator public key hash>')
      .example('node operator/print-status.js --ethnetwork rinkeby --operatorPublicKeyHash 0x03cd041b0139d3240607b9fd1b2d1b691e22b5d6')
    ).argv;

  var initObjects = utils.init(argv);
  var web3 = initObjects.web3;
  var DogeToken = initObjects.DogeToken;

  var operatorPublicKeyHash = argv.operatorPublicKeyHash;

  console.log("Print operator status for operator with public key hash " + operatorPublicKeyHash);

  // Do some checks
  if (!await utils.doSomeChecks(web3)) {
    return;
  }

  var dt = await DogeToken.deployed();
  var operator = await dt.operators.call(operatorPublicKeyHash);     
  console.log("Eth Address : " + operator[0].toString(16));       
  console.log("Doge available balance : " + utils.satoshiToDoge(operator[1].toNumber()) + " doges." );
  console.log("Doge pending balance : " + utils.satoshiToDoge(operator[2].toNumber())  + " doges." );
  console.log("Deposit : " + web3.fromWei(operator[4].toNumber())  + " eth.");       
  var operatorKeyIndex = operator[5];
  let operatorKey = await dt.operatorKeys(operatorKeyIndex);
  console.log("Active : " + (operatorKey[1] == false));
}

doIt();
