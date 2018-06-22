var utils = require('../utils');
var yargs = require('yargs');

async function doIt() {
  var argv = utils.completeYargs(yargs
      .option('k', {
        group: 'Data:',
        alias: 'privateKey',
        describe: 'private key in eth format',
        demandOption: true,
        type: 'string'
      })
      .option('d', {
        group: 'Optional:',
        alias: 'password',
        describe: 'password to encrypt the private key',
        demandOption: false,
        type: 'string',
        default: '',
        defaultDescription: "Encrypt the private key with an empty string as password."
      })
      .option('u', {
        group: 'Optional:',
        alias: 'unlock',
        describe: 'whether to automatically unlock the ethereum address',
        demandOption: false,
        type: 'boolean',
        default: true,
      })
      .option('e', {
        group: 'Optional:',
        alias: 'unlockTime',
        describe: 'number of seconds to keep the eth address unlocked',
        demandOption: false,
        type: 'number',
        default: 0,
        defaultDescription: "keep the eth address unlocked until the eth node exits."
      })
      .usage('Imports a dogecoin private key to ethereum node and unlocks it.\nUsage: node user/import-doge-key-to-eth.js --privateKey <private key in eth format>')
      .example('import-doge-key-to-eth.js --privateKey  0x17ad918b6f62b449f3978eafd5bf237e2dec84f1e0366babf88ef3850691adbc')
    ).argv;

  var initObjects = utils.init(argv);
  var web3 = initObjects.web3;
  var DogeToken = initObjects.DogeToken;

  var privateKey = argv.privateKey;
  var password = argv.password;
  var unlock = argv.unlock;
  var unlockTime = argv.unlockTime;

  console.log("Import doge key to eth " + privateKey + ", password " + (password!='' ? password : "<empty>") + ", unlock " + unlock + ", unlock time " + (unlockTime!=0 ? unlockTime :"<forever>") + ".");

  // Do some checks
  if (!await utils.doSomeChecks(web3)) {
    return;
  }

  // Add senderPrivateKey to eth node (if already added, this makes no harm)
  var dogeTokenHolderAddress = await web3.personal.importRawKey(privateKey, password);  
  console.log("Imported key for address " + dogeTokenHolderAddress);
  if (unlock) {
    await web3.personal.unlockAccount(dogeTokenHolderAddress, password, unlockTime);
    console.log("Unlocked address for " + (unlockTime!=0 ? unlockTime :"<forever>") + " seconds.");    
    console.log("Import and unlock done.");    
  } else {
    console.log("Import done.");    
  }
}

doIt();
