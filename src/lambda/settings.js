import Airtable from 'airtable'
import fs from 'fs'
import dotenv from 'dotenv'
var sigUtil = require('eth-sig-util') // NOTE: eth-sig-util does not support `import`.

import CONSTANTS from '../constants'
import getIdByAddress from '../utils/getIdByAddress'

// TODO: move to utils folder
// Set up airtable envs in the development envirronement.
if (fs.existsSync('.airtable')) {
  const envConfig = dotenv.parse(
    fs.readFileSync('.airtable')
  )

  for (let k in envConfig) {
    process.env[k] = envConfig[k]
  }
}

const { AIRTABLE_API_KEY } = process.env

exports.handler = async function(event, context, callback) {
    // Only allow GET or POST
  if (!["GET", "POST"].includes(event.httpMethod))
    return {
      statusCode: 403,
      body: JSON.stringify({ error: CONSTANTS.LAMBDA__METHOD_NOT_ALLOWED })
    }

  const params = JSON.parse(event.body)
  const network = params.network || "MAINNET"
  const signMsg = params.signMsg || ""
  const address = params.address || ""
  const email = params.email || ""
  const phoneNumber = params.phoneNumber || ""

  const signer = sigUtil.recoverPersonalSignature({
    data: `Signature required to check if your are the owner of this address: ${address}`,
    sig: signMsg
  })

  if (signer !== address.toLowerCase())
    return {
      statusCode: 405,
      body: JSON.stringify({ error: CONSTANTS.LAMBDA__ADDRESS__NOT_ALLOWED })
    }

  const base = new Airtable({ apiKey: AIRTABLE_API_KEY })
    .base(process.env[`AIRTABLE_${network.toUpperCase()}_BASE`])

  try {
    if (event.httpMethod === "GET") // GET
      base('Owners').select({
        view: 'Grid view',
        filterByFormula: `{Address} = '${address.toLowerCase()}'`
      }).firstPage((err, records) => {
        records.forEach(record => {
          return {
            statusCode: 200,
            body: JSON.stringify({ ID: record.get('ID') })
          }
        })
      })
    else {
      const recordOwner = await getIdByAddress(base, address.toLowerCase())

      if (recordOwner) {
        base('Owners').update([{
          "id": recordOwner.ID,
          "fields": {
            "Address": address.toLowerCase(),
            "Email": email,
            "Phone Number": phoneNumber
          }
        }])

        return {
          statusCode: 200,
          body: JSON.stringify({ result: CONSTANTS.LAMBDA__SETTINGS_UPDATED })
        }
      } else { // New Entry
        base('Owners').create({
          "Address": address.toLowerCase(),
          "Email": email,
          "Phone Number": phoneNumber
        })

        return {
          statusCode: 200,
          body: JSON.stringify({ result: CONSTANTS.LAMBDA__SETTINGS_ADDED })
        }
      }
    }
  } catch (err) {
    console.error(err)
    return {
      statusCode: 500,
      body: JSON.stringify({ err })
    }
  }
}
