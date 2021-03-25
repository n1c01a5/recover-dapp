import PropTypes from 'prop-types'
import React, { useEffect, useState } from 'react'
import styled from 'styled-components/macro'
import { navigate } from '@reach/router'
import { drizzleReactHooks } from '@drizzle/react-plugin'
import Dotdotdot from 'react-dotdotdot'

import { useDataloader } from '../../bootstrap/dataloader'
import Tile from '../../components/non-fungible-tokens/tile'

const { useDrizzle, useDrizzleState } = drizzleReactHooks

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 70px;
  grid-auto-rows: 290px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

const Type = styled.div`
  font-family: Nunito;
  font-weight: 600;
  font-size: 30px;
  color: #14213d;
  margin-bottom: 25px;
`

const Description = styled(Dotdotdot)`
  font-family: Nunito;
  font-size: 20px;
  color: #14213d;
  font-weight: 100;
`

const NonFungibleTokens = ({ network, contract, nonFungibleTokens }) => {
  const [isMMOpen, setMMOpen] = useState(false)

  const { useCacheCall } = useDrizzle()
  const drizzleState = useDrizzleState(drizzleState => ({
    account: drizzleState.accounts[0]
      ? drizzleState.accounts[0].toString()
      : '0x0000000000000000000000000000000000000000',
    networkID: drizzleState.web3.networkId
      ? drizzleState.web3.networkId.toString()
      : '1'
  }))

  useEffect(() => {
    // NOTE: redirect the client if the network does not match with the URL.
    if(network === 'mainnet' && drizzleState.networkID !== '1')
      navigate(`/network/kovan/contract/${nonFungibleTokens}`)
    else if (network === 'kovan' && drizzleState.networkID !== '42')
      navigate(`/network/mainnet/contract/${nonFungibleTokens}`)

    // NOTE: if the client does not injected web3, display the web3 modal.
    if (drizzleState.account === '0x0000000000000000000000000000000000000000')
      setMMOpen(true)
  }, [drizzleState])

  const loadDescription = useDataloader.getDataToken()

  const tokens = useCacheCall('NonFungibleTokens', 'balanceOf', drizzleState.account)

  const tokensOfOwner = useCacheCall(['NonFungibleTokens'], call =>
    tokens
      ? [...Array(Number(tokens)).keys()].reduce(
          (acc, d) => {
              const tokenID = call('NonFungibleTokens', 'tokenOfOwnerByIndex', drizzleState.account, d)
              if(tokenID) {
                let token = {}

                const tokenURI = call('NonFungibleTokens', 'tokenURI', tokenID)

                if (tokenURI) {// FIXME: loadDescription
                  const dataToken = loadDescription(
                    tokenURI
                  )
                  if (dataToken) token.content = dataToken
                }

                token.ID = tokenID
                token.tokenURI = tokenURI

                acc.data.push({...token})
              }

            return acc
          },
          {
            data: [],
            loading: false
          }
        )
      : { loading: true }
  )

  return (
    <Grid>
      <Tile isNewItem={true} network={network} contract={contract} />
      {
        !tokensOfOwner.loading && tokensOfOwner.data.map(token => (
          <Tile
          key={token.ID}
          network={network}
          onClick={
            () => navigate(`
              /network/${network}/contract/${contract}/non-fungible-tokens/${nonFungibleTokens}/tokens/${token.ID}
            `)
          }
        >
          <Type>{token.content && token.content.title}</Type>
          <Description clamp={5}>
            {token.ID}
          </Description>
        </Tile>
        ))
      }
    </Grid>
  )
}

NonFungibleTokens.propTypes = {
  network: PropTypes.string,
  contract: PropTypes.string,
  nonFungibleTokens: PropTypes.string,
}

NonFungibleTokens.defaultProps = {
  network: 'mainnet',
  contract: '0x00',
  nonFungibleTokens: '0x00'
}

export default NonFungibleTokens