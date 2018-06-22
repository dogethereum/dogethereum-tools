var utils = require('../utils');
var formatconverter = require('./formatconverter');
var yargs = require('yargs');
var BitcoindRpc = require('bitcoind-rpc');
var bitcoreLib = require('bitcore-lib');

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
  await invokeDogecoinRpc(dogecoinRpc, "getinfo");
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
        var Base58Check = bitcoreLib.encoding.Base58Check;
        var operatorDogeAddress = Base58Check.encode(Buffer.concat([Buffer.from([113]), utils.fromHex(operatorPublicKeyHash)]));
        console.log("Locking " + valueToLockWithThisOperator + " satoshi doges to address " + operatorDogeAddress + " using operator " + operatorPublicKeyHash);
        var sendtoaddressResult = await invokeDogecoinRpc(dogecoinRpc, "sendtoaddress", operatorDogeAddress, utils.satoshiToDoge(valueToLockWithThisOperator));
        console.log("Sent doge tx 0x" + sendtoaddressResult.result);        
        valueLocked += valueToLockWithThisOperator;
        var getrawtransactionResult = await invokeDogecoinRpc(dogecoinRpc, "getrawtransaction", sendtoaddressResult.result);        
        var decoderawtransactionResult = await invokeDogecoinRpc(dogecoinRpc, "decoderawtransaction", getrawtransactionResult.result);
        var firstInput = decoderawtransactionResult.result.vin[0];

        var getrawtransactionResult2 = await invokeDogecoinRpc(dogecoinRpc, "getrawtransaction", firstInput.txid);        
        var decoderawtransactionResult2 = await invokeDogecoinRpc(dogecoinRpc, "decoderawtransaction", getrawtransactionResult2.result);
        var userDogecoinAddress = decoderawtransactionResult2.result.vout[firstInput.vout].scriptPubKey.addresses[0];
        
        console.log("User Dogecoin Address : " + userDogecoinAddress);        
        var dumpprivkeyResult = await invokeDogecoinRpc(dogecoinRpc, "dumpprivkey", userDogecoinAddress);
        var userPrivKeyInDogeFormat = dumpprivkeyResult.result;
        console.log("User private key in dogecoin format : " + userPrivKeyInDogeFormat);
        var userPrivKeyInEthFormat = formatconverter.privKeyToEthFormat(userPrivKeyInDogeFormat)
        console.log("User private key in dogecoin eth format : " + "0x" + userPrivKeyInEthFormat);
        var userEthAddress = formatconverter.getEthAddress(userPrivKeyInDogeFormat)
        console.log("User eth address : " + "0x" + userEthAddress);
        



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


function invokeDogecoinRpc(dogecoinRpc, dogecoinRpcFunctionName) {
  var dogecoinRpcFunction = eval("dogecoinRpc." + dogecoinRpcFunctionName);
  var rpcParams = new Array();
  for (var i = 2; i < arguments.length; i++) {
    rpcParams.push (arguments[i]);
  }
  return new Promise(function(resolve, reject) {
    rpcParams.push (
      function (err, ret) {
        if (err) {
          console.error("Dogecoin RPC error : " + JSON.stringify(err));
          reject(err);
          return;
        }  
        resolve(ret);
      }
    );    
    dogecoinRpcFunction.apply(dogecoinRpc, rpcParams);
  });
}

doIt();

