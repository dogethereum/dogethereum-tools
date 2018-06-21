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
  await invokeDogecoinRpcGetinfo(dogecoinRpc);
  console.log("Connected to dogecoin node!");

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
  if(valueToLock < minLockValue) {
    console.log("Value to lock " + valueToLock + " doge satoshis is less than the minimum lock value " + minLockValue + " doge satoshis");
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

        // TODO var operatorDogeAddress = get it from operatorPublicKeyHash
        var operatorDogeAddress = "nbGHE7gTixD86ttUyTZ4QAjZN8pBh7kYUR";
        var sendtoaddressResult = await invokeDogecoinRpcSendtoaddress(dogecoinRpc, operatorDogeAddress, utils.satoshiToDoge(valueToLockWithThisOperator));
        console.log("Sent doge tx " + JSON.stringify(sendtoaddressResult));        
        valueLocked += valueToLockWithThisOperator;


        //const unlockTxReceipt = await dt.doUnlock(dogeDestinationAddress, valueToUnlock, , {from: sender, gas: 350000, gasPrice: argv.gasPrice});
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


function invokeDogecoinRpcOld(dogecoinRpc, dogecoinRpcFunctionName) {
  var dogecoinRpcFunction = eval("dogecoinRpc." + dogecoinRpcFunctionName + ".bind(dogecoinRpc)");
  return new Promise(function(resolve, reject) {
    dogecoinRpcFunction(function (err, ret) {
      if (err) {
        console.error("Can't connect to dogecoin node : " + JSON.stringify(err));
        reject(err);
        return;
      }  
      resolve(ret);
    });
  });
}


function invokeDogecoinRpcGetinfo(dogecoinRpc) {
  return new Promise(function(resolve, reject) {
    dogecoinRpc.getinfo(function (err, ret) {
      if (err) {
        console.error("Can't connect to dogecoin node : " + JSON.stringify(err));
        reject(err);
        return;
      }  
      resolve(ret);
    });
  });
}

function invokeDogecoinRpcSendtoaddress(dogecoinRpc, address, value) {
  return new Promise(function(resolve, reject) {
    dogecoinRpc.sendtoaddress(address, value, function (err, ret) {
      if (err) {
        console.error("Can't invoke dogecoin sendtoaddress : " + JSON.stringify(err));
        reject(err);
        return;
      }  
      resolve(ret);
    });
  });
}

// function invokeDogecoinRpc(dogecoinRpc, dogecoinRpcFunctionName) {
//   var dogecoinRpcFunction = eval("dogecoinRpc." + dogecoinRpcFunctionName);
//   var rpcParams = new Array();
//   for (var i = 2; i < arguments.length; i++) {
//     rpcParams.push (arguments[i]);
//   }
//   rpcParams.push (
//     function (err, ret) {
//       if (err) {
//         console.error("Dogecoin RPC error : " + JSON.stringify(err));
//         reject(err);
//         return;
//       }  
//       resolve(ret);
//     }
//   );  
//   return new Promise(function(resolve, reject) {
//     dogecoinRpcFunction.apply(dogecoinRpc, rpcParams);
//   });
// }

doIt();

