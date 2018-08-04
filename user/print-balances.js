var utils = require('../utils');
var yargs = require('yargs');

async function doIt() {
  var argv = utils.completeYargs(yargs
      .option('a', {
        group: 'Data:',
        alias: 'address',
        describe: 'eth address',
        demandOption: true
      })
      .usage('Prints eth and doge token balances of an eth address.\nUsage: node user/print-balances.js --ethnetwork <eth network> --address <eth address>')
      .example('node user/print-balances.js --ethnetwork rinkeby --address 0xd2394f3fad76167e7583a876c292c86ed1ffffff')
    ).argv;

  var initObjects = utils.init(argv);
  var web3 = initObjects.web3;
  var DogeToken = initObjects.DogeToken;

  var address = argv.address;

  console.log("Print eth and doge token balances for eth address " + address);

  // Do some checks
  if (!await utils.doSomeChecks(web3)) {
    return;
  }

  var dt = await DogeToken.deployed();
  var ethBalance = await web3.eth.getBalance(address);     
  console.log("Eth balance : " + web3.fromWei(ethBalance.toNumber()) + " eth.");
  var dogeTokenBalance = await dt.balanceOf.call(address);     
  console.log("Doge token balance : " + utils.satoshiToDoge(dogeTokenBalance.toNumber())  + " doge tokens.");
}

doIt();
