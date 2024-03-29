"use strict";

const ethers = require("ethers");
const bitcoreLib = require("bitcore-lib");
const yargs = require("yargs");

const utils = require("../utils");

const ECDSA = bitcoreLib.crypto.ECDSA;

async function doIt() {
  const argv = utils.completeYargs(
    yargs
      .option("dk", {
        group: "Data:",
        alias: "dogePrivateKey",
        describe: "operator private key used in dogecoin blockchain",
        demandOption: true,
      })
      .option("pk", {
        group: "Data:",
        alias: "ethPrivateKey",
        describe: "operator private key used in ethereum blockchain",
        demandOption: true,
      })
      .usage(
        `Registers a new operator. An operator can use separate private keys for Ethereum and Dogecoin.
Usage: node operator/addoperator.js --dogePrivateKey <dogecoin operator private key> --ethPrivateKey <ethereum operator private key>`
      )
      .example(
        "node operator/addoperator.js --dogePrivateKey 0x105bd30419904ef409e9583da955037097f22b6b23c57549fe38ab8ffa9deaa3 --ethPrivateKey 0xf968fec769bdd389e33755d6b8a704c04e3ab958f99cc6a8b2bcf467807f9634",
        "Register an operator for doge account given by private key 0x105bd30419904ef409e9583da955037097f22b6b23c57549fe38ab8ffa9deaa3 and ethereum account given by 0xf968fec769bdd389e33755d6b8a704c04e3ab958f99cc6a8b2bcf467807f9634"
      )
  ).argv;

  const { provider, dogeToken } = await utils.init(argv);

  const operatorSigner = new ethers.Wallet(argv.ethPrivateKey, provider);
  const operatorEthAddress = operatorSigner.address;

  const operatorDogeToken = dogeToken.connect(operatorSigner);

  const operatorDogePrivateKey = argv.dogePrivateKey;

  console.log(
    `Add operator with private key ${operatorDogePrivateKey} and eth address ${operatorEthAddress}`
  );

  // Do some checks
  await utils.checkSignerBalance(operatorEthAddress);

  // Add operator
  const { operatorPublicKeyCompressedString, signature } =
    operatorSignItsEthAddress(operatorDogePrivateKey, operatorEthAddress);
  const operatorPublicKeyHash = bitcoreLib.crypto.Hash.ripemd160(
    bitcoreLib.crypto.Hash.sha256(
      utils.fromHex(operatorPublicKeyCompressedString)
    )
  );
  console.log(
    `Operator public key hash: 0x${operatorPublicKeyHash.toString("hex")}`
  );

  console.log("Adding operator...");
  const addOperatorTx = await operatorDogeToken.addOperator(
    operatorPublicKeyCompressedString,
    signature,
    { gasLimit: 150000, gasPrice: argv.gasPrice }
  );
  const addOperatorTxReceipt = await addOperatorTx.wait();
  utils.printTxResult(addOperatorTxReceipt, "Add operator");
}

function operatorSignItsEthAddress(
  operatorPrivateKeyString,
  operatorEthAddress
) {
  // bitcoreLib.PrivateKey marks the private key as compressed if it receives a String as a parameter.
  // bitcoreLib.PrivateKey marks the private key as uncompressed if it receives a Buffer as a parameter.
  // In fact, private keys are not compressed/uncompressed. The compressed/uncompressed attribute
  // is used when generating a compressed/uncompressed public key from the private key.
  // Ethereum addresses are first 20 bytes of keccak256(uncompressed public key)
  // Dogecoin public key hashes are calculated: ripemd160((sha256(compressed public key));
  const operatorPrivateKeyCompressed = bitcoreLib.PrivateKey(
    utils.remove0x(operatorPrivateKeyString)
  );
  const operatorPrivateKeyUncompressed = bitcoreLib.PrivateKey(
    utils.fromHex(operatorPrivateKeyString)
  );
  const operatorPublicKeyCompressedString = `0x${operatorPrivateKeyCompressed
    .toPublicKey()
    .toString()}`;

  // TODO: avoid using bare crypto primitives
  // Generate the msg to be signed: double sha256 of operator eth address
  const operatorEthAddressHash = bitcoreLib.crypto.Hash.sha256sha256(
    utils.fromHex(operatorEthAddress)
  );

  // TODO: avoid using bare crypto primitives
  // Operator private key uncompressed sign msg
  const ecdsa = new ECDSA();
  ecdsa.hashbuf = operatorEthAddressHash;
  ecdsa.privkey = operatorPrivateKeyUncompressed;
  ecdsa.pubkey = operatorPrivateKeyUncompressed.toPublicKey();
  ecdsa.signRandomK();
  ecdsa.calci();
  const signature = `0x${ecdsa.sig.toCompact().toString("hex")}`;
  return { operatorPublicKeyCompressedString, signature };
}

doIt()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(`Unhandled failure.
${error.stack || error}`);
    process.exit(1);
  });
