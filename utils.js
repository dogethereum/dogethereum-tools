const Web3 = require("web3");
const path = require("path");
const fs = require("fs");

const pkg = require("./package.json");

function completeYargs(yargs) {
  return yargs
    .option("n", {
      group: "Connection:",
      alias: "ethnetwork",
      describe: "Eth network to be used. This option is ignored.",
      deprecated: true,
      type: "string",
      choices: ["ganacheDogeRegtest", "ganacheDogeMainnet", "rinkeby"],
      demandOption: false,
    })
    .option("t", {
      group: "Connection:",
      alias: "host",
      default: "127.0.0.1",
      type: "string",
      describe: "host of the ethereum node",
    })
    .option("p", {
      group: "Connection:",
      alias: "port",
      default: 8545,
      type: "number",
      describe: "port of the ethereum node",
      check: (val) => val >= 1 && val <= 65535,
    })
    .option("g", {
      group: "Connection:",
      alias: "gasPrice",
      describe: "The price of gas in wei",
      type: "number",
      default: 20000000000,
    })
    .option("j", {
      group: "Connection:",
      alias: "deployment",
      describe:
        "Location of the deployment artifact json. Useful during development on 'ganacheDogeRegtest' or 'ganacheDogeMainnet' networks.",
      type: "string",
      demandOption: false,
    })
    .showHelpOnFail(false, "Specify -h, -? or --help for available options")
    .help("h")
    .alias("h", ["?", "help"])
    .version(`Dogethereum tools ${pkg.version}`);
}

async function init(argv) {
  const web3 = new Web3(`http://${argv.host}:${argv.port}`);

  const deploymentPath = argv.deployment
    ? argv.deployment
    : path.resolve(__dirname, "deployment/deployment.json");
  const deployment = JSON.parse(fs.readFileSync(deploymentPath));

  const contracts = await loadDeployment(web3, deployment);
  return { web3, argv, ...contracts };
}

async function loadDeployment(web3, deployment) {
  const chainId = await web3.eth.getChainId();
  if (chainId !== deployment.chainId) {
    throw new Error(
      `Expected a deployment for network with chainId ${chainId} but found chainId ${deployment.chainId} instead.`
    );
  }

  const dogeTokenArtifact = deployment.contracts.dogeToken;

  return {
    dogeToken: new web3.eth.Contract(
      dogeTokenArtifact.abi,
      dogeTokenArtifact.address
    ),
  };
}

async function doSomeChecks(web3, sender) {
  // Do some checks
  if (sender !== undefined) {
    // Make sure sender has some eth to pay for txs
    const senderEthBalance = await web3.eth.getBalance(sender);
    if (senderEthBalance === "0") {
      throw new Error("Sender address has no eth balance, aborting.");
    } else {
      console.log(
        `Sender eth balance: ${web3.utils.fromWei(
          senderEthBalance
        )} eth. Please, make sure that is enough to pay for the tx fee.`
      );
    }
  }
}

async function printDogeTokenBalances(dt, sender, receiver) {
  // Print sender DogeToken balance
  const senderDogeTokenBalance = await dt.balanceOf.call(sender);
  console.log(
    `Sender doge token balance: ${satoshiToDoge(
      senderDogeTokenBalance.toNumber()
    )} doge tokens.`
  );

  if (receiver !== undefined) {
    // Print receiver DogeToken balance
    const receiverDogeTokenBalance = await dt.balanceOf.call(receiver);
    console.log(
      `Receiver doge token balance: ${satoshiToDoge(
        receiverDogeTokenBalance.toNumber()
      )} doge tokens.`
    );
  }
}

function satoshiToDoge(dogeSatoshis) {
  return dogeSatoshis / 100000000;
}

function printTxResult(txReceipt, operation) {
  if (
    txReceipt.logs.length == 1 &&
    txReceipt.logs[0].event == "ErrorDogeToken"
  ) {
    console.log(
      `${operation} failed!. Error: ${txReceipt.logs[0].args.err.toNumber()}`
    );
  } else {
    console.log(`${operation} done.`);
  }
}

function fromHex(data) {
  return Buffer.from(remove0x(data), "hex");
}

function remove0x(str) {
  return str.startsWith("0x") ? str.substring(2) : str;
}

module.exports = {
  completeYargs,
  init,
  doSomeChecks,
  printDogeTokenBalances,
  satoshiToDoge,
  printTxResult,
  fromHex,
  remove0x,
};
