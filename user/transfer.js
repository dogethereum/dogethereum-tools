var process = require('process');
var Web3 = require('web3');
var contract = require("truffle-contract");
var path = require('path');
const fs = require('fs');
var utils = require('./utils');

var provider = new Web3.providers.HttpProvider("http://localhost:8545");
var web3 = new Web3(provider);
const DogeTokenJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../dogerelay/build/contracts/DogeToken.json')));
const DogeToken = contract(DogeTokenJson);
DogeToken.setNetwork('32000'); // integrationDogeRegtest
DogeToken.setProvider(provider);


async function doIt() {
  var argv = process.argv;
  var sender = utils.getCliParam(argv, 0);
  var receiver = utils.getCliParam(argv, 1);
  var valueToTransfer = utils.getCliParam(argv, 2);

  console.log("Transfer " + utils.dogeToSatoshi(valueToTransfer) + " doge tokens from " + sender + " to " + receiver);

  // Do some checks
  if (!await utils.doSomeChecks(web3, sender, valueToTransfer)) {
    return;
  }

  var dt = await DogeToken.deployed();
  await utils.printDogeTokenBalances(dt, sender, receiver);
  // Do transfer  
  console.log("Initiating transfer... ");
  await dt.transfer(receiver, valueToTransfer, {from: sender});     
  console.log("Transfer Done.");
  await utils.printDogeTokenBalances(dt, sender, receiver);
}

doIt();
