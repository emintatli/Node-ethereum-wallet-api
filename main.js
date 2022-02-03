import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { MongoClient } from "mongodb";
const sha256 = require("js-sha256");
const Web3 = require("web3");
const ethWallet = require("ethereumjs-wallet");
var utils = require("ethereumjs-util");
const express = require("express");
const cors = require("cors");
const app = express();
const HDWalletProvider = require("@truffle/hdwallet-provider");
const devMode = true;
const uri = devMode ? "mongodb+srv://autorun12:satellitea10@cluster0.1dybm.mongodb.net" : "";
const rpcUrl = devMode
  ? "https://data-seed-prebsc-1-s1.binance.org:8545/"
  : "https://bsc-dataseed.binance.org/";
  var corsOptions = {
    origin: "http://localhost:3000",
    optionsSuccessStatus: 200, 
  };
  app.use(cors(corsOptions));
let client;
async function init() {
  client = new MongoClient(
    uri,
    { useUnifiedTopology: true },
    { useNewUrlParser: true },
    { connectTimeoutMS: 30000 },
    { keepAlive: 1 }
  );
  await client.connect();
}
init();

const checkAlreadyExist = async (data, res) => {
  try {
    const database = client.db("walletapp");
    const collection = database.collection("walletapp");
    const query = { username: data.username };
    const user = await collection.findOne(query);
    if (user) {
      res.status(400).json({ err: "username already exists." });
      return true;
    } else {
      return false;
    }
  } catch (err) {
    console.log(err);

    res.status(400).json({ err });
    return true;
  }
};

const createWalletForNewUser = async () => {
  const EthWallet = ethWallet.default.generate();
  return {
    address: EthWallet.getAddressString(),
    privateKey: EthWallet.getPrivateKeyString(),
  };
};

const createAccessToken = async (data) => {
  return sha256(data.password + data.username + Math.random());
};

const register = async (data, res) => {
  if (
    data.username &&
    data.password &&
    data.pin &&
    (await checkAlreadyExist(data, res)) === false
  ) {
    const database = client.db("walletapp");
    const collection = database.collection("walletapp");
    const userWallet = createWalletForNewUser();
    const doc = {
      username: data.username,
      password: await sha256(data.password),
      wallet: (await userWallet).address,
      privateKey: (await userWallet).privateKey,
      accessToken: await createAccessToken(data),
      pin: data.pin,
    };
    await collection.insertOne(doc);
    res.status(200).json({ status: "User Registered" });
  } else {
    res.status(400).json({ err: "invalid details." });
  }
};

const registerWithPrivate = async (data, res) => {
  let walletAddress = false;
  try {
    var privateKey = utils.toBuffer(data.privateKey);
    var publicKey = utils.privateToPublic(privateKey);
    var address = utils.pubToAddress(publicKey);
    var channelAddress = address.toString("hex");
    walletAddress = Web3.utils.toChecksumAddress(channelAddress);
  } catch (err) {
    console.log(err);
    res.status(400).json({ err });
  }
  if (
    data.username &&
    data.password &&
    data.pin &&
    walletAddress &&
    (await checkAlreadyExist(data, res)) === false
  ) {
    const database = client.db("walletapp");
    const collection = database.collection("walletapp");
    const userWallet = {
      wallet: walletAddress,
      privateKey: data.privateKey,
    };
    const doc = {
      username: data.username,
      password: await sha256(data.password),
      wallet: (await userWallet).wallet,
      privateKey: (await userWallet).privateKey,
      accessToken: await createAccessToken(data),
      pin: data.pin,
    };
    await collection.insertOne(doc);
    res.status(200).json({ status: "User Registered" });
  } else {
    res.status(400).json({ err: "invalid details." });
  }
};

const login = async (data, res) => {
  if (data.username && data.password) {
    const database = client.db("walletapp");
    const collection = database.collection("walletapp");
    const query = { username: data.username, password: sha256(data.password) };
    const user = await collection.findOne(query);
    if (user) {
      res
        .status(200)
        .json({ username: user.username, wallet: user.wallet, accessToken: user.accessToken });
    } else {
      res.status(400).json({ err: "invalid details." });
    }
  }
};

const getUserInfo = async (data, res) => {
  try {
    const database = client.db("walletapp");
    const collection = database.collection("walletapp");
    const query = { accessToken: data.accessToken };
    const user = await collection.findOne(query);
    if (user) {
      return user;
    } else {
      return null;
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({ err });
    return null;
  }
};

const checkPin = async (accessToken, pin) => {
  try {
    const database = client.db("walletapp");
    const collection = database.collection("walletapp");
    const query = { accessToken: accessToken };
    const user = await collection.findOne(query);
    if (user.pin == pin) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({ err });
    return null;
  }
};

const sendBalancetoAddress = async (data, res) => {
  if (await checkPin(data.accessToken, data.pin)) {
    const userDetails = await getUserInfo(data, res);
    const provider = new HDWalletProvider(userDetails.privateKey, rpcUrl);
    const web3 = new Web3(provider);
    const contractAbi = [
      {
        inputs: [
          { internalType: "address", name: "recipient", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
        ],
        name: "transfer",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function",
      },
    ];
    const contract = new web3.eth.Contract(contractAbi, data.tokenAddress);
    const tx = await contract.methods
      .transfer(data.to, data.amount)
      .send({ from: userDetails.wallet });
    res.status(200).json({ tx });
  } else {
    res.status(400).json({ err: "incorrect pin" });
  }
};

const searchUser = async (username) => {
  try {
    const database = client.db("walletapp");
    const collection = database.collection("walletapp");
    const query = { username: username };
    const user = await collection.findOne(query);
    if (user) {
      return user.wallet;
    } else {
      return null;
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({ err });
    return null;
  }
};

const sendBalancetoUser = async (data, res) => {
  if (await checkPin(data.accessToken, data.pin)) {
    const userDetails = await getUserInfo(data, res);
    const provider = new HDWalletProvider(userDetails.privateKey, rpcUrl);
    const web3 = new Web3(provider);
    const contractAbi = [
      {
        inputs: [
          { internalType: "address", name: "recipient", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
        ],
        name: "transfer",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function",
      },
    ];
    const contract = new web3.eth.Contract(contractAbi, data.tokenAddress);
    const toSendWallet = await searchUser(data.toUser);
    if (toSendWallet) {
      const tx = await contract.methods
        .transfer(toSendWallet, data.amount)
        .send({ from: userDetails.wallet });
      res.status(200).json({ tx });
    } else {
      res.status(400).json({ err: "user not found." });
    }
  } else {
    res.status(400).json({ err: "incorrect pin" });
  }
};
const checkBalance = async (data, res) => {
  if (data.accessToken && data.tokenAddress) {
    try {
      const userDetails = await getUserInfo(data, res);
      const web3 = new Web3(rpcUrl);
      const tokenAbi = [
        {
          constant: true,
          inputs: [
            {
              name: "_owner",
              type: "address",
            },
          ],
          name: "balanceOf",
          outputs: [
            {
              name: "balance",
              type: "uint256",
            },
          ],
          payable: false,
          stateMutability: "view",
          type: "function",
        },
      ];
      const contract = new web3.eth.Contract(tokenAbi, data.tokenAddress);
      const tx = await contract.methods.balanceOf(userDetails.wallet).call();
      res.status(200).json({ tx });
    } catch (err) {
      res.status(400).json({ err });
    }
  } else {
    res.status(400).json({ err: "invalid parameters" });
  }
};

app.use("/api/:id", express.json(), async (req, res) => {
  const route  = req.params.id;
  console.log(req.params.id)
  const register_data = {
    username: req.query.username,
    password: req.query.password,
    pin: req.query.pin,
  };
  const registerWithPrivate_data = {
    username: req.query.username,
    password: req.query.password,
    privateKey: req.query.private,
    pin: req.query.pin,
  };
  const login_data = {
    username: req.query.username,
    password: req.query.password,
  };
  const sendBalance_data = {
    tokenAddress: req.query.tokenAddress,
    amount: req.query.amount,
    accessToken: req.query.accessToken,
    to: req.query.to,
    pin: req.query.pin,
  };
  const sendBalanceToUser_data = {
    tokenAddress: req.query.tokenAddress,
    amount: req.query.amount,
    accessToken: req.query.accessToken,
    toUser: req.query.toUser,
    pin: req.query.pin,
  };
  const checkUserBalance = {
    tokenAddress: req.query.tokenAddress,
    accessToken: req.query.accessToken,
  };
  switch (route) {
    case "register":
      await register(register_data, res);
      break;
    case "registerWithPrivate":
      await registerWithPrivate(registerWithPrivate_data, res);
      break;
    case "login":
      await login(login_data, res);
      break;
    case "sendBalanceToAddress":
      await sendBalancetoAddress(sendBalance_data, res);
      break;
    case "sendBalanceToUser":
      await sendBalancetoUser(sendBalanceToUser_data, res);
      break;
    case "checkUserBalance":
      await checkBalance(checkUserBalance, res);
      break;
    default:
      res.status(400).json({ err: "api route error." });
  }
});

app.listen(process.env.PORT || 3002);