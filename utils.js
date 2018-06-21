var Web3 = require('web3');
var contract = require("truffle-contract");
var path = require('path');
var fs = require('fs');
var pkg = require("./package.json");


module.exports = {
  completeYargs: function (yargs) {
    return yargs
    .option('n', {
      group: 'Optional:',
      alias: 'network',
      describe: "Eth network to be used",
      defaultDescription: "ropsten",
      defaultDescription: "Ropsten test network.",
      demandOption: false
    })
    .option('t', {
      group: 'Optional:',
      alias: 'host',
      default: '127.0.0.1',
      describe: 'host of the ethereum node'
    })
    .option('p', {
      group: 'Optional:',
      alias: 'port',
      default: 8545,
      describe: 'port of the ethereum node',
      check: val => val >= 1 && val <= 65535
    })
    .option('g', {
      group: 'Optional:',
      alias: 'gasPrice',
      describe: 'The price of gas in wei',
      type: 'number',
      default: 20000000000
    })
    .showHelpOnFail(false, 'Specify -h, -? or --help for available options') 
    .help('h')
    .alias('h', ['?', 'help'])
    .version(pkg.version);
  }
  ,
  init: function (argv) {
    var provider = new Web3.providers.HttpProvider("http://" + argv.host + ":" + argv.port);
    var web3 = new Web3(provider);

    var network = argv.network;
    var dogeTokenJsonPath;
    var networkId;
    if (network == 'integrationDogeRegtest') {
      dogeTokenJsonPath = '../dogerelay/build/contracts/DogeToken.json';
      networkId = '32001';
    } else if (network == 'ropstem') {
      dogeTokenJsonPath = 'json/DogeToken.json';
      networkId = '3';
    }
    const DogeTokenJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, dogeTokenJsonPath)));
    const DogeToken = contract(DogeTokenJson);
    DogeToken.setNetwork(networkId);
    DogeToken.setProvider(provider);  
    return {web3: web3, argv : argv, DogeToken: DogeToken};
  }
  ,
  doSomeChecks: async function (web3, sender) {
    // Do some checks
    if(!web3.isConnected()) {
      console.log("Can't connect to ethereum node.");
      return false;
    }
    if (sender) {
      try {
        web3.eth.sign(sender, "sample message");
      } catch(err) {
        console.log("Can't use sender private key. Please, make sure the connected ethereum node has sender private key and that account is unlocked.");
        console.log(err);
        return false;
      }
      // Make sure sender has some eth to pay for txs
      var senderEthBalance = await web3.eth.getBalance(sender);     
      if (senderEthBalance.toNumber() == 0) {
        console.log("Sender address has no eth balance, aborting.");
        return false;
      } else {
        console.log("Sender eth balance : " + web3.fromWei(senderEthBalance.toNumber()) + " ETH. Please, make sure that is enough to pay for the tx.");
      }      
    }
    return true;
  }
  ,
  printDogeTokenBalances: async function (dt, sender, receiver) {
    // Print sender DogeToken balance
    var senderDogeTokenBalance = await dt.balanceOf.call(sender);     
    console.log("Sender doge token balance : " + module.exports.satoshiToDoge(senderDogeTokenBalance.toNumber())  + " doge tokens.");     

    if (receiver) {
      // Print receiver DogeToken balance
      var receiverDogeTokenBalance = await dt.balanceOf.call(receiver);     
      console.log("Receiver doge token balance : " + module.exports.satoshiToDoge(receiverDogeTokenBalance.toNumber())  + " doge tokens.");               
    }
  }
  ,
  satoshiToDoge: function (num) {
    return num / 100000000;
  }
  ,
  printTxResult: function (txReceipt, operation) {
    if (txReceipt.logs.length == 1 && txReceipt.logs[0].event == "ErrorDogeToken") {
      console.log(operation + " failed!. Error : " + txReceipt.logs[0].args.err.toNumber());
    } else {
      console.log(operation + " done.");
    }
  }
}  



