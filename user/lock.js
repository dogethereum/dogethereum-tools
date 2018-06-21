var utils = require('../utils');
var yargs = require('yargs');
var BitcoindRpc = require('bitcoind-rpc');

async function doIt() {
  var argv = utils.completeYargs(yargs
      .option('dt', {
        group: 'Optional:',
        alias: 'dogehost',
        default: '127.0.0.1',
        describe: 'host of the dogecoin node',
        demandOption: false
      })
      .option('dp', {
        group: 'Optional:',
        alias: 'dogeport',
        default: 44555, //mainnet: 22555 or testnet: 44555
        describe: 'port of the dogecoin node',
        type: 'number',
        check: val => val >= 1 && val <= 65535,
        demandOption: false
      })
      .option('du', {
        group: 'Optional:',
        alias: 'dogeuser',
        default: '',
        describe: 'user of the dogecoin node rpc',
        demandOption: false
      })
      .option('dd', {
        group: 'Optional:',
        alias: 'dogepassword',
        default: '',
        describe: 'password of the dogecoin node rpc',
        demandOption: false
      })
      .option('v', {
        group: 'Data:',
        alias: 'value',
        describe: 'number of doge satoshis to transfer',
        type: 'number',
        demandOption: true
      })
      .usage('Converts doges on the dogecoin blockchain to doge tokens on the eth blockchain.\nUsage: node user/lock.js --network <eth network>  --value <number of doge satoshis>')
      .example('node user/lock.js --network ropsten --value 200000000')
    ).argv;

  var initObjects = utils.init(argv);
  var web3 = initObjects.web3;
  var DogeToken = initObjects.DogeToken;

  var dogehost = argv.dogehost
  var dogeport = argv.dogeport;
  var dogeuser = argv.dogeuser;
  var dogepassword = argv.dogepassword;
  var valueToLock = argv.value;

  console.log("Lock " + utils.satoshiToDoge(valueToLock) + " doges.");

  var dogeRpcConfig = {
    protocol: 'http',
    user: argv.dogeuser,
    pass: argv.dogepassword,
    host: argv.dogehost,
    port: argv.dogeport,
  };

  var dogecoinRpc = new BitcoindRpc(dogeRpcConfig);
  var dogecoinRpcInfo = await invokeDogecoinRpc(dogecoinRpc.getInfo.bind(dogecoinRpc));
  console.log("Connected to dogecoin node!");
  console.log("dogecoinRpcInfo " + JSON.stringify(dogecoinRpcInfo));

  return;

 

  // Do some checks
  if (!await utils.doSomeChecks(web3)) {
    return;
  }
  if(!(valueToLock > 0)) {
    console.log("Value should be greater than 0");
    return;
  }

  var dt = await DogeToken.deployed();

  // Do lock
  console.log("Initiating lock... ");
  var minLockValue = await dt.MIN_LOCK_VALUE();
  minLockValue = minLockValue.toNumber();
  if(valueToLock < minUnlockValue) {
    console.log("Value tolock " + valueToLock + " should be at least " + minLockValue);
    return false;
  }  

  var dogeEthPrice = await dt.dogeEthPrice();
  dogeEthPrice = dogeEthPrice.toNumber();
  var collateralRatio = await dt.collateralRatio();
  collateralRatio = collateralRatio.toNumber();

  const operatorsLength = await dt.getOperatorsLength();
  var valueLocked = 0;
  for (var i = 0; i < operatorsLength; i++) {      
    let operatorKey = await dt.operatorKeys(i);
    if (operatorKey[1] == false) {
      // not deleted
      let operatorPublicKeyHash = operatorKey[0];
      let operator = await dt.operators(operatorPublicKeyHash);
      var operatorDogeAvailableBalance = operator[1].toNumber();
      var operatorDogePendingBalance = operator[2].toNumber();
      var operatorEthBalance = operator[4].toNumber();

      var operatorReceivableDoges = (operatorEthBalance / dogeEthPrice / collateralRatio) - (operatorDogeAvailableBalance + operatorDogePendingBalance);


      if (operatorReceivableDoges >= minLockValue) {
        var valueToLockWithThisOperator = Math.min(valueToLock - valueLocked, operatorReceivableDoges);
        console.log("Locking " + valueToLockWithThisOperator + " satoshi doges using operator " + operatorPublicKeyHash);             

        //const unlockTxReceipt = await dt.doUnlock(dogeDestinationAddress, valueToUnlock, operatorPublicKeyHash, {from: sender, gas: 350000, gasPrice: argv.gasPrice});
        //utils.printTxResult(unlockTxReceipt, "Unlock");
        //if (!(unlockTxReceipt.logs.length == 1 && unlockTxReceipt.logs[0].event == "ErrorDogeToken")) {
        //  // lock succeded
        //  valueLocked += valueToLockWithThisOperator;
        //}        
      }
    }
    if (valueLocked == valueToLock) {
      break;
    }
  }
  console.log("Total locked " + valueLocked + " satoshi doges");    

  console.log("Lock Done.");
}

function invokeDogecoinRpc(dogecoinRpcFunction) {
  return new Promise(function(resolve, reject) {
    dogecoinRpcFunction(function (err, ret) {
      if (err) {
        console.error("Can't connect to dogecoin node : " + err);
        reject(err);
        return;
      }  
      resolve(ret);
    });
  });
}

doIt();

