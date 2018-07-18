var Web3 = require('web3');
var contract = require("truffle-contract");
var path = require('path');
var fs = require('fs');
var pkg = require("./package.json");


module.exports = {
  completeYargs: function (yargs) {
    return yargs
    .option('n', {
      group: 'Connection:',
      alias: 'ethnetwork',
      describe: "Eth network to be used",
      default: "ropsten",
      defaultDescription: "Ropsten test network.",
      choices: ['ganacheDogeRegtest', 'ganacheDogeMainnet', 'ropsten'],
      demandOption: false
    })
    .option('t', {
      group: 'Connection:',
      alias: 'host',
      default: '127.0.0.1',
      describe: 'host of the ethereum node'
    })
    .option('p', {
      group: 'Connection:',
      alias: 'port',
      default: 8545,
      describe: 'port of the ethereum node',
      check: val => val >= 1 && val <= 65535
    })
    .option('g', {
      group: 'Connection:',
      alias: 'gasPrice',
      describe: 'The price of gas in wei',
      type: 'number',
      default: 20000000000
    })
    .option('j', {
      group: 'Connection:',
      alias: 'json',
      describe: "Location of the truffle DogeToken json. Just to be using during development on 'ganacheDogeRegtest' or 'ganacheDogeMainnet' network.",
      demandOption: false
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

    var ethnetwork = argv.ethnetwork;
    var dogeTokenJsonPath;
    var ethNetworkId;
    if (ethnetwork == 'ganacheDogeRegtest') {
      dogeTokenJsonPath = argv.json;
      ethNetworkId = '32001';
    } else if (ethnetwork == 'ganacheDogeMainnet') {
      dogeTokenJsonPath = argv.json;
      ethNetworkId = '32000';
    } else if (ethnetwork == 'ropsten') {
      dogeTokenJsonPath = path.resolve(__dirname, 'json/DogeToken.json');
      ethNetworkId = '3';
    }
    const DogeTokenJson = JSON.parse(fs.readFileSync(dogeTokenJsonPath));
    const DogeToken = contract(DogeTokenJson);
    DogeToken.setNetwork(ethNetworkId);
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
        console.log("Sender eth balance : " + web3.fromWei(senderEthBalance.toNumber()) + " eth. Please, make sure that is enough to pay for the tx fee.");
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
  },
  fromHex: function (data) {
    return Buffer.from(module.exports.remove0x(data), 'hex');
  }
  ,
  remove0x: function (str) {
    return (str.indexOf("0x")==0) ? str.substring(2) : str;
  }  
}  



