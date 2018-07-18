var utils = require('../utils');
var yargs = require('yargs');
var bitcoreLib = require('bitcore-lib');
var ECDSA = bitcoreLib.crypto.ECDSA;
var bitcoreMessage = require('bitcore-message');



async function doIt() {
  var argv = utils.completeYargs(yargs
      .option('k', {
        group: 'Data:',
        alias: 'privateKey',
        describe: 'operator private key in eth format',
        demandOption: true
      })
      .option('a', {
        group: 'Data:',
        alias: 'ethAddress',
        describe: 'operator eth address',
        demandOption: true
      })
      .usage('Registers a new operator.\nUsage: node operator/addoperator.js --ethnetwork <eth network> --privateKey <operator private key in eth format> --ethAddress <operator eth address>')
      .example('node operator/addoperator.js --ethnetwork ropsten --privateKey 0x105bd30419904ef409e9583da955037097f22b6b23c57549fe38ab8ffa9deaa3 --ethAddress 0xd2394f3fad76167e7583a876c292c86ed1ffffff')
    ).argv;

  var initObjects = utils.init(argv);
  var web3 = initObjects.web3;
  var DogeToken = initObjects.DogeToken;

  var operatorPrivateKeyString = argv.privateKey;
  var operatorEthAddress = argv.ethAddress;

  console.log("Add operator with private key " + operatorPrivateKeyString + " and eth address " + operatorEthAddress);

  // Do some checks
  if (!await utils.doSomeChecks(web3, operatorEthAddress)) {
    return;
  }

  var dt = await DogeToken.deployed();

  // Add operator  
  var operatorSignItsEthAddressResult = operatorSignItsEthAddress(operatorPrivateKeyString, operatorEthAddress)
  var operatorPublicKeyCompressedString = operatorSignItsEthAddressResult[0];
  var signature = operatorSignItsEthAddressResult[1];
  var operatorPublicKeyHash = bitcoreLib.crypto.Hash.ripemd160(bitcoreLib.crypto.Hash.sha256(utils.fromHex(operatorPublicKeyCompressedString)));
  console.log("Operator public key hash:  " + "0x" + operatorPublicKeyHash.toString('hex'));

  console.log("Adding operator... ");
  var dt = await DogeToken.deployed();
  const addOperatorTxReceipt = await dt.addOperator(operatorPublicKeyCompressedString, signature, {from: operatorEthAddress, gas: 150000, gasPrice: argv.gasPrice});
  utils.printTxResult(addOperatorTxReceipt, "Add operator");
}

function operatorSignItsEthAddress(operatorPrivateKeyString, operatorEthAddress) {
    // bitcoreLib.PrivateKey marks the private key as compressed if it receives a String as a parameter.
    // bitcoreLib.PrivateKey marks the private key as uncompressed if it receives a Buffer as a parameter.
    // In fact, private keys are not compressed/uncompressed. The compressed/uncompressed attribute
    // is used when generating a compressed/uncompressed public key from the private key.
    // Ethereum addresses are first 20 bytes of keccak256(uncompressed public key)
    // Dogecoin public key hashes are calculated: ripemd160((sha256(compressed public key));
    const operatorPrivateKeyCompressed = bitcoreLib.PrivateKey(utils.remove0x(operatorPrivateKeyString));
    const operatorPrivateKeyUncompressed = bitcoreLib.PrivateKey(utils.fromHex(operatorPrivateKeyString))
    const operatorPublicKeyCompressedString = "0x" + operatorPrivateKeyCompressed.toPublicKey().toString();

    // Generate the msg to be signed: double sha256 of operator eth address
    const operatorEthAddressHash = bitcoreLib.crypto.Hash.sha256sha256(utils.fromHex(operatorEthAddress));

    // Operator private key uncompressed sign msg
    var ecdsa = new ECDSA();
    ecdsa.hashbuf = operatorEthAddressHash;
    ecdsa.privkey = operatorPrivateKeyUncompressed;
    ecdsa.pubkey = operatorPrivateKeyUncompressed.toPublicKey();
    ecdsa.signRandomK();
    ecdsa.calci();
    var ecdsaSig = ecdsa.sig;
    var signature = "0x" + ecdsaSig.toCompact().toString('hex');
    return [operatorPublicKeyCompressedString, signature];
}

doIt();
