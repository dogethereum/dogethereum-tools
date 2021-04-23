"use strict";

const bitcoreLib = require("bitcore-lib");

/**
 * @param dogePrivateKey Private key in WIF (Wallet Import Format)
 */
function keyDogeToEthInBytes(dogePrivateKey) {
  const decodedKey = bitcoreLib.encoding.Base58.decode(dogePrivateKey);
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
