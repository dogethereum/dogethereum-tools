const ethers = require("ethers");
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
  const provider = ethers.getDefaultProvider(
    `http://${argv.host}:${argv.port}`
  );

  const deploymentPath = argv.deployment
    ? argv.deployment
    : path.resolve(__dirname, "deployment/deployment.json");
  const deployment = JSON.parse(fs.readFileSync(deploymentPath));

  const contracts = await loadDeployment(provider, deployment);
  return { provider, argv, ...contracts };
}

async function loadDeployment(provider, deployment) {
  const { chainId } = await provider.getNetwork();
  if (chainId !== deployment.chainId) {
    throw new Error(
      `Expected a deployment for network with chainId ${chainId} but found chainId ${deployment.chainId} instead.`
    );
  }

  const dogeTokenArtifact = deployment.contracts.dogeToken;

  return {
    dogeToken: new ethers.Contract(
      dogeTokenArtifact.address,
      dogeTokenArtifact.abi,
      provider
    ),
  };
}

async function checkSignerBalance(signer) {
  // Make sure sender has some eth to pay for txs
  const senderEthBalance = await signer.getBalance();
  if (senderEthBalance.isZero()) {
    throw new Error("Sender address has no eth balance, aborting.");
  } else {
    console.log(
      `Sender eth balance: ${ethers.utils.formatEther(
        senderEthBalance
      )} eth. Please, make sure that is enough to pay for the tx fee.`
    );
  }
}

async function printDogeTokenBalances(dogeToken, sender, receiver) {
  // Print sender DogeToken balance
  const senderDogeTokenBalance = await dogeToken.callStatic.balanceOf(sender);
  console.log(
    `Sender doge token balance: ${satoshiToDoge(
      senderDogeTokenBalance
    )} doge tokens.`
  );

  if (receiver !== undefined) {
    // Print receiver DogeToken balance
    const receiverDogeTokenBalance = await dogeToken.callStatic.balanceOf(
      receiver
    );
    console.log(
      `Receiver doge token balance: ${satoshiToDoge(
        receiverDogeTokenBalance
      )} doge tokens.`
    );
  }
}

function satoshiToDoge(dogeSatoshis) {
  const dogeDecimals = 8;
  return ethers.utils.formatUnits(dogeSatoshis, dogeDecimals);
}

function printTxResult(txReceipt, operation) {
  if (txReceipt.events === undefined) {
    throw new Error(
      "No events in tx {txReceipt.transactionHash} for operation ${operation}"
    );
  }

  const errorEvents = txReceipt.events.filter((event) => {
    event.event === "ErrorDogeToken";
  });
  if (errorEvents.length === 0) {
    console.log(`${operation} done. Tx hash: ${txReceipt.transactionHash}`);
    return;
  }

  console.error(`Doge token error events in tx: ${txReceipt.transactionHash}`);
  for (const event of errorEvents) {
    // TODO: This is actually an error code. We want to provide a human readable error message here.
    console.error(
      `Doge token error event index ${event.logIndex}: ${event.args}`
    );
  }
  throw new Error(`Operation ${operation} failed!`);
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
  checkSignerBalance,
  printDogeTokenBalances,
  satoshiToDoge,
  printTxResult,
  fromHex,
  remove0x,
};
