var utils = require('./utils');

async function doIt() {
  var initObjects = utils.init();
  var argv = initObjects.argv;
  var web3 = initObjects.web3;
  var DogeToken = initObjects.DogeToken;

  var sender = utils.getCliParam(argv, 1);
  var receiver = utils.getCliParam(argv, 2);
  var valueToTransfer = utils.getCliParam(argv, 3);

  console.log("Transfer " + utils.dogeToSatoshi(valueToTransfer) + " doge tokens from " + sender + " to " + receiver);

  // Do some checks
  if (!await utils.doSomeChecks(web3, sender, valueToTransfer)) {
    return;
  }

  var dt = await DogeToken.deployed();
  await utils.printDogeTokenBalances(dt, sender, receiver);
  // Do transfer  
  console.log("Initiating transfer... ");
  await dt.transfer(receiver, valueToTransfer, {from: sender});     
  console.log("Transfer Done.");
  await utils.printDogeTokenBalances(dt, sender, receiver);
}

doIt();
