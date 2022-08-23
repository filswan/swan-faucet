const express = require('express')
const parser = require('body-parser')
const cors = require('cors')
const Web3 = require('web3')
const svgCaptcha = require('svg-captcha')
const session = require('express-session')
const tokenConfig = require('./tokenConfig')
const redis = require('./redis')

require('dotenv').config()

const web3 = {
  mumbai: new Web3(
    process.env.RPC_URL_MUMBAI || 'https://matic-mumbai.chainstacklabs.com',
  ),
  tbnc: new Web3(process.env.RPC_URL_BINANCE_TESTNET),
}

// ENVIRONMENT VARIABLES
const NATIVE_TOKEN = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
const port = process.env.PORT || 5000
const walletAddress = process.env.WALLET_ADDRESS
const privateKey = process.env.PRIVATE_KEY

const faucetAddress = {
  mumbai: process.env.FAUCET_ADDRESS_MUMBAI,
  tbnc: process.env.FAUCET_ADDRESS_BINANCE_TESTNET,
}

web3.mumbai.eth.accounts.wallet.add(privateKey) // adds account using private key
web3.tbnc.eth.accounts.wallet.add(privateKey) // adds account using private key

const faucetInterface = [
  {
    inputs: [
      {
        internalType: 'address[]',
        name: '_tokenAddresses',
        type: 'address[]',
      },
      {
        internalType: 'uint256[]',
        name: '_tokenAmounts',
        type: 'uint256[]',
      },
      {
        internalType: 'address',
        name: '_address',
        type: 'address',
      },
    ],
    name: 'sendMultiTokens',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_address',
        type: 'address',
      },
    ],
    name: 'allowedToWithdraw',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]
const tokenInterface = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
]
const faucetContract = {
  mumbai: new web3.mumbai.eth.Contract(faucetInterface, faucetAddress.mumbai, {
    from: walletAddress,
  }),
  tbnc: new web3.tbnc.eth.Contract(faucetInterface, faucetAddress.tbnc, {
    from: walletAddress,
  }),
}

let app = express()
app.use(
  session({
    secret: 'nbfs-swan',
    saveUninitialized: false,
    resave: false,
    cookie: {
      maxAge: 300 * 1000,
    },
  }),
  parser.json(),
)
app.use(
  cors({
    origin: '*',
  }),
)

// MIDDLEWARE ****************************************************************
var HashMap = require('hashmap')
var codeMap = new HashMap()

const verifyCode = async (req, res, next) => {
  const verification_code = req.body.verification_code.toLowerCase()

  if (verification_code != codeMap.get(verification_code)) {
    return res.status(505).json('verification code failed')
  }
  codeMap.delete(verification_code)
  next()
}

// add 24 hour rate limit
const limiter = async (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  const requests = await redis.get(ip)
  if (requests >= 1) {
    res.status(429).send('rate limit exceeded')
  } else next()
}
// ****************************************************************

app.get('/ttl', async (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  const ttl = await redis.ttl(ip)
  res.status(200).send({ ip, ttl })
})

app.get('/req', limiter, async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  const requests = await redis.incr(ip)

  if (requests === 1) {
    await redis.expire(ip, 20)
  }

  res.status(200).send({ ip, requests })
})

app.get('/code', function (req, res) {
  var codeConfig = {
    size: 5,
    noise: 3,
    fontSize: 42,
    color: true,
    background: '#f5f7fa',
    width: 150,
    height: 38,
  }
  var captcha = svgCaptcha.create(codeConfig)
  var verification_code = captcha.text.toLowerCase()
  codeMap.set(verification_code, verification_code)
  var codeData = {
    img: captcha.data,
  }
  res.type('svg')
  res.status(200).send(captcha.data)
})

app.post('/', verifyCode, limiter, async (req, res) => {
  const network = req.body.network
  const toAddress = req.body.account
  const checkSumAddress = await web3[network].utils.toChecksumAddress(toAddress)
  const tokenAmounts = req.body.amounts
  const tokenAddresses = await Promise.all(
    req.body.tokens.map(
      async (tokenAddress) =>
        await web3[network].utils.toChecksumAddress(tokenAddress),
    ),
  )

  // get faucet balance status, also remove addressese from array
  const {
    faucetStatus,
    eligibleTokens,
    eligibleAmounts,
  } = await checkFaucetStatus(
    network,
    tokenAddresses,
    tokenAmounts,
    checkSumAddress,
  )

  if (eligibleTokens.length > 0) {
    try {
      const gasPrice = await web3[network].eth.getGasPrice()
      console.log(gasPrice)

      const transaction = await faucetContract[network].methods
        .sendMultiTokens(eligibleTokens, eligibleAmounts, checkSumAddress)
        .send({ gas: 9999999, gasPrice })

      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
      const requests = await redis.incr(ip)

      if (requests === 1) {
        await redis.expire(ip, 60 * 60 * 24)
      }

      console.log(transaction.transactionHash)

      res.json([...faucetStatus, { tx_hash: transaction.transactionHash }])
    } catch (err) {
      console.log(err)
      res.status(500).json(err)
    }
  } else res.json(faucetStatus)
})

app.listen(port, () => {
  console.log(`Faucet server listening at http://localhost:${port}`)
})

// return object { status, eligibleTokens, eligibleAmounts }
const checkFaucetStatus = async (
  network,
  tokenAddresses,
  tokenAmounts,
  address,
) => {
  let faucetStatus = []
  let eligibleTokens = []
  let eligibleAmounts = []

  const allowedToWithdraw = await faucetContract[network].methods
    .allowedToWithdraw(address)
    .call()

  // if user is not allowed to withdraw, dont need to run for loop
  if (!allowedToWithdraw) {
    faucetStatus = tokenAddresses.map((tokenAddress) => {
      return { address: tokenAddress, result: -1, err: 'please wait 24 hrs' }
    })
  } else {
    for (let i = 0; i < tokenAddresses.length; i++) {
      let faucetBalance = 0
      let addressStatus = { address: tokenAddresses[i], result: 0 }

      // get faucet balance
      if (tokenAddresses[i] == NATIVE_TOKEN) {
        faucetBalance = await web3[network].eth.getBalance(
          faucetAddress[network],
        )
      } else {
        let tokenContract = new web3[network].eth.Contract(
          tokenInterface,
          tokenAddresses[i],
        )
        faucetBalance = await tokenContract.methods
          .balanceOf(faucetAddress[network])
          .call()
      }

      // get token max amount
      const tokenObject =
        tokenConfig.filter((tokenObject) => {
          return (
            tokenObject.tokenAddress == tokenAddresses[i] &&
            tokenObject.network == network
          )
        })[0] || 0

      // if there is an err (tokenAmount too large, not enough token balance) set err message
      if (
        web3[network].utils
          .toBN(faucetBalance)
          .lt(web3[network].utils.toBN(tokenAmounts[i])) ||
        web3[network].utils
          .toBN(tokenAmounts[i])
          .gt(web3[network].utils.toBN(tokenObject.maxAmount))
      ) {
        // change the token status
        addressStatus.result = -1
        addressStatus.err = `running out of ${tokenObject.name} tokens`

        // change err message if token amount is too large
        if (
          web3[network].utils
            .toBN(tokenAmounts[i])
            .gt(web3[network].utils.toBN(tokenObject.maxAmount))
        )
          addressStatus.err = 'exceeding maximum amount'
      } else {
        eligibleTokens.push(tokenAddresses[i])
        eligibleAmounts.push(tokenAmounts[i])
      }

      faucetStatus.push(addressStatus)
    }
  }

  return { faucetStatus, eligibleTokens, eligibleAmounts }
}
