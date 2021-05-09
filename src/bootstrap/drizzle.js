import { Drizzle, generateStore } from '@drizzle/store'

import Recover from '../assets/contracts/recover.json'
import KlerosLiquid from '../assets/contracts/kleros-liquid.json'
import NonFungibleTokens from '../assets/contracts/non-fungible-tokens.json'

const options = {
  contracts: [
    {
      ...Recover,
      networks: {
        1: { address: process.env.REACT_APP_RECOVER_MAINNET_ADDRESS },
        42: { address: process.env.REACT_APP_RECOVER_KOVAN_ADDRESS },
        100: { address: process.env.REACT_APP_RECOVER_XDAI_ADDRESS },
        77: { address: process.env.REACT_APP_RECOVER_SOKOL_ADDRESS }
      }
    },
    {
      ...KlerosLiquid,
      networks: {
        1: { address: process.env.REACT_APP_ARBITRATOR_MAINNET_ADDRESS },
        42: { address: process.env.REACT_APP_ARBITRATOR_KOVAN_ADDRESS },
        100: { address: process.env.REACT_APP_ARBITRATOR_XDAI_ADDRESS },
        77: { address: process.env.REACT_APP_ARBITRATOR_SOKOL_ADDRESS }
      }
    },
    {
      ...NonFungibleTokens,
      networks: {
        1: { address: process.env.REACT_APP_NON_FUNGIBLE_TOKENS_MAINNET_ADDRESS },
        42: { address: process.env.REACT_APP_NON_FUNGIBLE_TOKENS_KOVAN_ADDRESS },
        100: { address: process.env.REACT_APP_NON_FUNGIBLE_TOKENS_XDAI_ADDRESS },
        77: { address: process.env.REACT_APP_NON_FUNGIBLE_TOKENS_SOKOL_ADDRESS }
      }
    }
  ],
  polls: {
    accounts: 3000,
    blocks: 3000
  },
  web3: {
    fallback: {
      type: 'ws',
      // FIXME: switch to the kovan fallback if the app uses the kovan network
      // For this, we need to compute the network before the execution of this file.
      url: process.env.REACT_APP_WEB3_MAINNET_FALLBACK_URL
    }
  }
}

export default new Drizzle(options, generateStore(options))
