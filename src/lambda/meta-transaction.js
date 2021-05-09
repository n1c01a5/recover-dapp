import fs from 'fs'
import dotenv from 'dotenv'
import * as sigUtil from 'eth-sig-util'
import * as ethUtil from 'ethereumjs-util'

import isNetworkWhitelisted from '../utils/native-meta-transaction/is-network-whitelisted'
import isFunctionWhitelisted from '../utils/native-meta-transaction/is-function-whitelisted'
import isAccountMatchesSignature from '../utils/native-meta-transaction/is-account-matches-signature'
import isABIFunctionMatchesSignature from '../utils/native-meta-transaction/is-abi-function-matches-signature'

import recoverABI from '../assets/contracts/recover.json'

/** This is the best way to import ethers, otherwise it throws errors */
const { ethers } = require('ethers');

import getLoserBoxNftByID from '../utils/get-loser-box-nft-by-id'

// TODO: move to utils folder
// Set up airtable envs in the development environment.
if (fs.existsSync('.airtable')) {
  const envConfig = dotenv.parse(
    fs.readFileSync('.airtable')
  )

  for (let k in envConfig) {
    process.env[k] = envConfig[k]
  }
}

const {
  PROVIDER_XDAI_URI,
  PROVIDER_SOKOL_URI,
  PAYMASTER_PRIVATE_KEY,
  RECOVER_XDAI_CONTRACT_ADDRESS,
  RECOVER_SOKOL_CONTRACT_ADDRESS,
  META_TRANSACTION_PAYMASTER_PRIVATE_KEY,
  META_TRANSACTION_GAS_LIMIT
} = process.env

// FIXME: Can be remove because pass directly to the function
const RECOVER_FUNCTION_CLAIM_ABI = [
  'function claim(bytes32 _itemID, address _finder, string _descriptionLink)'
]
const RECOVER_FUNCTION_ADD_ITEM_ABI = [
  'function addItem(bytes32 _itemID, address _addressForEncryption, string _descriptionEncryptedLink, uint256 _rewardAmount, uint256 _timeoutLocked)' // FIXME: add good params
]

exports.handler = async function(event) {
  // Only allow GET
  if (event.httpMethod !== "GET")
    return { statusCode: 405, body: "Method Not Allowed" }

  const network = event.queryStringParameters.network.toUpperCase() || "XDAI"
  const from = event.queryStringParameters.from || "0x0000000000000000000000000000000000000000"
  const functionSignature = event.queryStringParameters.functionSignature || ""
  const functionABI = event.queryStringParameters.functionABI || ""
  const signature = event.queryStringParameters.signature || ""

  /**
   * Create pay master wallet
   * We must set a provider
   */
  const provider = new ethers.providers.JsonRpcProvider(network === 'SOKOL' ? PROVIDER_SOKOL_URI : PROVIDER_XDAI_URI)
  const payMasterWallet = new ethers.Wallet(META_TRANSACTION_PAYMASTER_PRIVATE_KEY, provider)

  /**
  * Create the smart contract instance
  */
  const recoverContract = new ethers.Contract(network === 'SOKOL' ? RECOVER_SOKOL_CONTRACT_ADDRESS : RECOVER_XDAI_CONTRACT_ADDRESS, recoverABI, payMasterWallet)

  /**
  * Check network, function and account and execute the meta-transaction is everything is fine.
  */
  if(!isNetworkWhitelisted({network})) {
    return {
      statusCode: 400,
      body: `This ${network} is not whitelisted.`
    }
  } else if(!isFunctionWhitelisted({functionABI})) {
    return {
      statusCode: 400,
      body: `This ABI function ${functionABI} is not whitelisted.`
    }
  } else if(!isAccountMatchesSignature({from, signature})) {
    return {
      statusCode: 400,
      body: `This account ${from} does not match with the signature.`
    }
  } else if(!isABIFunctionMatchesSignature(functionABI)) {
    return {
      statusCode: 400,
      body: `This account ${from} does not match with the signature.`
    }
  } else {
    return executeMetaTransaction({
      contractInstance,
      from,
      functionSignature,
      signature,
      gasLimit
    })
  }
}

const executeMetaTransaction = async ({
  contractInstance,
  from,
  functionSignature,
  signature,
  gasLimit
}) => {
  const { r, s, v } = ethUtil.fromRpcSig(signature)

  /**
  * Execute meta transaction
  */
  const { hash, gasPrice } = await utils.executeMetaTransaction(
    contractABI,
    from,
    functionSignature,
    signature
  )

  const { hash, gasPrice } = await contractInstance.executeMetaTransaction(
    from,
    functionSignature,
    r,
    s,
    v,
    { gasLimit }
  )

  /**
   * Wait for transaction to complete
   */
  const { gasUsed, status } = await provider.waitForTransaction(hash)

  const feesFormatERC20 = ethers.utils.formatEther(gasUsed.mul(gasPrice).toString())

  return {
    hash,
    fees: Number(feesFormatERC20),
    gasPriceUsed,
    status: status === 1 ? 'success' : 'fail'
  }
}