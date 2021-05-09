import Airtable from 'airtable'
import fs from 'fs'
import dotenv from 'dotenv'
import * as sigUtil from 'eth-sig-util'
import * as ethUtil from 'ethereumjs-util'

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

const { AIRTABLE_API_KEY } = process.env

exports.handler = async function(event) {
  // Only allow GET
  if (event.httpMethod !== "GET")
    return { statusCode: 405, body: "Method Not Allowed" }

  const tokenID = event.queryStringParameters.tokenID || "0"
  const network = event.queryStringParameters.network.toUpperCase() || "MAINNET"
  const msgParams = JSON.parse(decodeURI(event.queryStringParameters.msgParams)) || {}
  const signatureNFTID = event.queryStringParameters.signatureNFTID || ""

  const base = new Airtable({ apiKey: AIRTABLE_API_KEY })
    .base(process.env[`AIRTABLE_${network}_BASE`])
  
  const recoveredSignatureAddress = sigUtil.recoverTypedSignature_v4({
    data: msgParams,
    sig: signatureNFTID
  })

  const NFTPks = await getLoserBoxNftByID(base, tokenID)

  if (ethUtil.toChecksumAddress(recoveredSignatureAddress) === ethUtil.toChecksumAddress(NFTPks.ownerAddress)) {
    try {
      return {
        statusCode: 200,
        body: JSON.stringify({ result: NFTPks })
      }
    } catch (err) {
      console.error(err)
      return {
        statusCode: 500,
        body: JSON.stringify({ err })
      }
    }
  } else {
    return {
      statusCode: 400,
      body: 'The NFT signature does not match with the owner address of the NFT.'
    }
  }
}
