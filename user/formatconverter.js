"use strict";

const bitcoreLib = require("bitcore-lib");
const wallet = require("ethereumjs-wallet");

function keyDogeToEthInBytes(privKeyAsExportedByDogecoinDumpprivkey) {
  const decodedKey = bitcoreLib.encoding.Base58.decode(
    privKeyAsExportedByDogecoinDumpprivkey
  );
  const privKeyBytes = decodedKey.slice(1, decodedKey.length - 5);
  return privKeyBytes;
}

function privKeyToEthFormat(dogePrivateKey) {
  const privKeyBytes = keyDogeToEthInBytes(dogePrivateKey);
  const privKeyInEthFormat = Buffer.from(privKeyBytes).toString("hex");
  return privKeyInEthFormat;
}

function getEthAddress(dogePrivateKey) {
  const myWallet = wallet.fromPrivateKey(
    new Buffer(keyDogeToEthInBytes(dogePrivateKey))
  );
  const addressInEthFormat = myWallet.getAddress();
  return addressInEthFormat.toString("hex");
}
module.exports = {
  privKeyToEthFormat,
  getEthAddress,
};
