var bitcoreLib = require('bitcore-lib');
var wallet = require('ethereumjs-wallet');

function keyDogeToEthInBytes(privKeyAsExportedByDogecoinDumpprivkey) {
    var decodedKey = bitcoreLib.encoding.Base58.decode(privKeyAsExportedByDogecoinDumpprivkey);
    var privKeyBytes = decodedKey.slice(1, decodedKey.length - 5);
    return privKeyBytes;
}

function privKeyToEthFormat(dogePrivateKey) {
	var privKeyBytes = keyDogeToEthInBytes(dogePrivateKey);
	var privKeyInEthFormat = new Buffer(privKeyBytes).toString('hex');
	return privKeyInEthFormat;
}

function getEthAddress(dogePrivateKey) {
	var myWallet = wallet.fromPrivateKey(new Buffer(keyDogeToEthInBytes(dogePrivateKey)));
	var addressInEthFormat = myWallet.getAddress();
	return addressInEthFormat.toString('hex');
}
module.exports = {
	privKeyToEthFormat: function (dogePrivateKey) {
		return privKeyToEthFormat(dogePrivateKey);
	},
	getEthAddress: function (dogePrivateKey) {
		return getEthAddress(dogePrivateKey);
	},
};