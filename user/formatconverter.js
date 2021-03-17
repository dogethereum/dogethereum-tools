"use strict";

const bitcoreLib = require("bitcore-lib");

function keyDogeToEthInBytes(privKeyAsExportedByDogecoinDumpprivkey) {
  const decodedKey = bitcoreLib.encoding.Base58.decode(
    privKeyAsExportedByDogecoinDumpprivkey
  );
  const privKeyBytes = decodedKey.slice(1, decodedKey.length - 5);
  return Buffer.from(privKeyBytes);
}

function privKeyToEthFormat(dogePrivateKey) {
  const privKeyBytes = keyDogeToEthInBytes(dogePrivateKey);
  const privKeyInEthFormat = `0x${privKeyBytes.toString("hex")}`;
  return privKeyInEthFormat;
}

function getEthAddress(web3, dogePrivateKey) {
  const myWallet = web3.eth.accounts.privateKeyToAccount(
    privKeyToEthFormat(dogePrivateKey)
  );
  return myWallet.address;
}
module.exports = {
  privKeyToEthFormat,
  getEthAddress,
  keyDogeToEthInBytes,
};
