import PropTypes from 'prop-types'
import React, { useEffect, useState, useCallback } from 'react'
import styled from 'styled-components/macro'
import { drizzleReactHooks } from '@drizzle/react-plugin'
import { navigate } from '@reach/router'
import Web3 from 'web3'
import * as sigUtil from 'eth-sig-util'
import * as ethUtil from 'ethereumjs-util'
import Modal from 'react-responsive-modal'

import Tabs, { TabsItem } from '../../components/tabs/tabs'
import Table, { Row, Cell } from '../../components/table'
import MessageBox from '../../components/message-box'
import Button from '../../components/button'
import { useDataloader } from '../../bootstrap/dataloader'
import generateMsgParamsNFT from '../../utils/generate-msg-params-nft'
import nonFungibleLoserBoxTokenContractABI from '../../assets/contracts/non-fungible-tokens.json'
import recoverContractABI from '../../assets/contracts/recover.json'

const { useDrizzle, useDrizzleState } = drizzleReactHooks

const Container = styled.div`
  font-family: Nunito;
  color: #444;
  margin: 0 126px;
  padding: 77px 0;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0px 4px 50px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  @media (max-width: 768px) {
    padding: 3em 0 2em 0;
    margin: 0;
  }
`

const Title = styled.h2`
  font-family: Nunito;
  font-size: 30px;
  color: #14213d;
  padding: 20px 0 20px 114px;
  @media (max-width: 768px) {
    padding: 0;
    text-align: center;
  }
`

const Content = styled.div`
  padding: 20px 114px 20px 114px;
`

const Token = ({ network, contract, nonFungibleTokens, tokenID }) => {
  const recoverLS = JSON.parse(localStorage.getItem('recover') || '{}')
  const loserBoxNFTPksByToken = recoverLS

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMMOpen, setMMOpen] = useState(false)
  const [isNFTSignatureRejected, setIsNFTSignatureRejected] = useState(false)
  const [privateKeysNFT, setPrivateKeysNFT] = useState(null)
  const [isAlreadyAskForSign, setIsAlreadyAskForSign] = useState(false)
  const [loserBoxTokenURI, setLoserBoxTokenURI] = useState(null)
  const [arrayIsItem, setArrayIsItem] = useState([])
  const [ethereum] = useState( // FIXME: do we need the `useState()`?
    new Web3(Web3.givenProvider)
  )

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
    // FIXME: show a modal and redirect to home with the food network: url and metamask.
    if(
      network === 'mainnet' && drizzleState.networkID !== '1'
      || network === 'kovan' && drizzleState.networkID !== '42'
      || network === 'xdai' && drizzleState.networkID !== '100'
      || network === 'sokol' && drizzleState.networkID !== '77'
    ) alert('Wrong network! Network allowed: Mainnet, Kovan, Xdai and Sokol.')

    // NOTE: if the client does not injected web3, display the web3 modal.
    if (drizzleState.account === '0x0000000000000000000000000000000000000000')
      setMMOpen(true)
  }, [drizzleState])

  useEffect(() => {
    if(loserBoxNFTPksByToken && loserBoxNFTPksByToken.loserBoxNFTPks && loserBoxNFTPksByToken.loserBoxNFTPks[tokenID]) {
      setPrivateKeysNFT(loserBoxNFTPksByToken.loserBoxNFTPks[tokenID])
      setIsModalOpen(false)
    } else {
      setIsModalOpen(true)
    }
  }, [])

  useEffect(() => {
    const checkItemIfRegistered = async () => {
      const nonFungibleLoserBoxTokenContractAddress = network === 'kovan'
        ? process.env.REACT_APP_NON_FUNGIBLE_TOKENS_KOVAN_ADDRESS
        : network === 'mainnet'
          ? process.env.REACT_APP_NON_FUNGIBLE_TOKENS_MAINNET_ADDRESS
          : network === 'sokol'
            ? process.env.REACT_APP_NON_FUNGIBLE_TOKENS_SOKOL_ADDRESS
            : process.env.REACT_APP_NON_FUNGIBLE_TOKENS_XDAI_ADDRESS

      const recoverContractAddress = network === 'kovan'
        ? process.env.REACT_APP_RECOVER_KOVAN_ADDRESS
        : network === 'mainnet'
          ? process.env.REACT_APP_RECOVER_MAINNET_ADDRESS
          : network === 'sokol'
            ? process.env.REACT_APP_RECOVER_SOKOL_ADDRESS
            : process.env.REACT_APP_RECOVER_XDAI_ADDRESS

      const nonFungibleLoserBoxTokenContract = new ethereum.eth.Contract(nonFungibleLoserBoxTokenContractABI.abi, nonFungibleLoserBoxTokenContractAddress)
      const recoverContract = new ethereum.eth.Contract(recoverContractABI.abi, recoverContractAddress)

      const loserBoxTokenURIResponse = await nonFungibleLoserBoxTokenContract.methods.tokenURI(tokenID).call()

      const metadataTokenJson = await fetch(`https://${process.env.REACT_APP_NON_FUNGIBLE_TOKENS_IPFS_NODE_URL}${loserBoxTokenURIResponse}`)

      const metadataToken = await metadataTokenJson.json()

      const arrayIsItemFromContract = []

      const itemsIDs = Object.keys(metadataToken.items)

      const lastItem = await itemsIDs.reduce(async (prev, curr, index) => { // NOTE: we have to resolve the last promise.
        const isItemExist = await prev

        if (typeof isItemExist !== 'undefined')
          arrayIsItemFromContract[itemsIDs[index - 1]] = isItemExist

        return recoverContract.methods.isItemExist(curr).call()
      }, Promise.resolve())

      // NOTE: We add the last item to the array.
      arrayIsItemFromContract[itemsIDs[itemsIDs.length - 1]] = lastItem

      await setArrayIsItem(arrayIsItemFromContract)
    }

    checkItemIfRegistered() // TODO: add result to the local storage and update it if necessary.
  }, [])

  const signNFT = useCallback(async () => {
    const chainId = network === 'kovan'
      ? 42 
      : network === 'mainnet'
        ? 1
        : network === 'sokol'
          ? 77
          : 100

    const accounts = await ethereum.eth.getAccounts()

    const domainType = [     
      { name: "name", type: "string" },     
      { name: "version", type: "string" },
      { name: "salt", type: "bytes32"}
    ]
    const messageType = [
      { name: "tokenID", type: "string" }
    ]
    const domainData = {
      name: "Loser Box NFT",
      version: "1",
      salt: '0x' + chainId.toString(16).padStart(64, '0')
    }

    const msgParams = {
      types: {
        EIP712Domain: domainType,
        Message: messageType
      },
      domain: domainData,
      primaryType: "Message",
      message: {
        tokenID
      }
    }

    await ethereum.currentProvider.send(
      {
        id: 1,
        method: "eth_signTypedData_v4",
        params: [accounts[0], JSON.stringify(msgParams)],
        from: accounts[0]
      },
      async (err, result) => {
        if (err) {
          setIsNFTSignatureRejected(true)
          return console.error(err);
        }
        const signature = `0x${result.result.substring(2)}`

        const from = accounts[0]

        const recovered = sigUtil.recoverTypedSignature_v4({
          data: msgParams,
          sig: signature
        })

        if (ethUtil.toChecksumAddress(recovered) === ethUtil.toChecksumAddress(from)) {
          // TODO: add try catch to catch exception
          const resLoserBoxNFTPksRaw = await fetch(
            `/.netlify/functions/loser-box?network=${network}&tokenID=${tokenID}&msgParams=${encodeURI(JSON.stringify(msgParams))}&signatureNFTID=${signature}`
          )

          if (resLoserBoxNFTPksRaw.status !== 200) { // NOTE: Check server side if it's the good owner.
            setIsNFTSignatureRejected(true)
          } else {
            const resLoserBoxNFTPks = await resLoserBoxNFTPksRaw.json()

            const privateKeysNFTResult = resLoserBoxNFTPks.result

            setPrivateKeysNFT(privateKeysNFTResult)
  
            const loserBoxNFTPks = recoverLS.loserBoxNFTPks

            window.localStorage.setItem(
              'recover',
              JSON.stringify({
                ...recoverLS,
                loserBoxNFTPks: {
                  ...loserBoxNFTPks,
                  [tokenID]: privateKeysNFTResult
                }
              })
            )
            setIsModalOpen(false)
          }
        } else {
          setIsNFTSignatureRejected(true)
        }
      }
    )
  })

  const loadDescription = useDataloader.getDataToken()

  const tokenURI = useCacheCall('NonFungibleTokens', 'tokenURI', tokenID)

  const dataTokenJson = useCacheCall(['NonFungibleTokens'], call => {
    const tokenURI = call('NonFungibleTokens', 'tokenURI', tokenID)
    if (tokenURI) {// FIXME: loadDescription naming
      const dataTokenJson = loadDescription( // FIXME: Don't use loadDescription()
        tokenURI
      )
      if (dataTokenJson) return dataTokenJson
    }
  })

  return (
    <Container>
      {console.log({arrayIsItem})}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        center
        styles={{
          closeButton: { display: 'none' },
          modal: { position: 'relative', top: '-10vh', width: '80vw', maxWidth: '700px', padding: '30px 50px', borderRadius: '15px' }
        }}
      >
        <h1
          style={{
            fontFamily: 'Nunito',
            fontSize: '40px',
            color: '#14213D'
          }}
        >
          Ownership NFT Loser Box proof
        </h1>
        <p
          style={{
            fontFamily: 'Roboto',
            fontSize: '16px',
            lineHeight: '19px',
            color: '#444',
            padding: '20px 0'
          }}
        >
          Proof you are the owner of the non-fungible Loser Box token (NFT) to get the keys
          to encrypt the personal details in signing the token ID of the NFT with your account.
        </p>
        <p
          style={{
            fontFamily: 'Roboto',
            fontSize: '16px',
            lineHeight: '19px',
            color: '#444',
            paddingBottom: '20px'
          }}
        >
          It’s a off-chain transaction, so it’s a free cost signature.
        </p>
        {
          isNFTSignatureRejected && (
            <MessageBox isWarning>
              <span
                style={{
                  display: 'block'
                }}
              >
                Signature required
              </span>
              <p
                style={{
                  fontFamily: 'Roboto',
                  fontSize: '16px',
                  lineHeight: '19px',
                  color: '#444',
                  paddingTop: '20px'
                }}
              >
                We cannot display the items if you don’t sign the non fungible token or if the signature does not match with the wallet.
              </p>
              <p
                style={{
                  fontFamily: 'Roboto',
                  fontSize: '16px',
                  lineHeight: '19px',
                  color: '#444',
                  paddingTop: '14px'
                }}
              >
                You have to use the wallet with the NFT Loser Box token.
              </p>
            </MessageBox>
          )
        }
        <div
          style={{textAlign: 'right'}}
        >
          <Button onClick={signNFT}>Proof ownership of the NFT</Button>
        </div>
      </Modal>
      {dataTokenJson ? (
        <Tabs>
          <TabsItem key='Stickers' label='Stickers'>
            <Table>
              <Row isHeader>
                <Cell isHeader width={'400px'}>#</Cell>
                <Cell isHeader textAlign='right'>Action</Cell>
              </Row>
              {
                privateKeysNFT && dataTokenJson.itemsByCategory.stickers.map((stickerID, index) => (
                  <Row key={stickerID}>
                    <Cell width={'400px'}>{stickerID.substring(0, 18)}</Cell>
                    <Cell
                      textAlign='right'
                      isAction
                      onClick={() => navigate(`
                        /network/${network}/contract/${contract}/${arrayIsItem[stickerID] ? `items/${stickerID.substring(0, 18)}/owner` : `new/items/${stickerID.substring(0, 18)}/pk/${privateKeysNFT[`sticker${index}`]}`}`
                      )}
                    >
                      {
                        typeof arrayIsItem[stickerID] === 'undefined'
                          ? '...'
                          : arrayIsItem[stickerID]
                            ? 'View'
                            : 'Create'
                      }
                    </Cell>
                  </Row>
                ))
              }
            </Table>
          </TabsItem>
          <TabsItem key='Cards' label='Cards'>
            <Table>
              <Row isHeader>
                <Cell isHeader width={'400px'}>#</Cell>
                <Cell isHeader textAlign='right'>Action</Cell>
              </Row>
              {
                privateKeysNFT && dataTokenJson.itemsByCategory.cards.map((cardID, index) => (
                  <Row key={cardID}>
                    <Cell width={'400px'}>{cardID.substring(0, 18)}</Cell>
                    <Cell
                      textAlign='right'
                      isAction
                      onClick={() => navigate(
                        `/network/${network}/contract/${contract}/new/items/${cardID.substring(0, 18)}/pk/${privateKeysNFT[`card${index}`]}`
                      )}
                    >
                      {
                        typeof arrayIsItem[cardID] === 'undefined' 
                          ? '...'
                          : arrayIsItem[cardID]
                            ? 'View'
                            : 'Create'
                      }
                    </Cell>
                  </Row>
                ))
              }
            </Table>
          </TabsItem>
          <TabsItem key='Key Ring' label='Key Ring'>
            <Table>
              <Row isHeader>
                <Cell isHeader width={'400px'}>#</Cell>
                <Cell isHeader textAlign='right'>Action</Cell>
              </Row>
              {
                privateKeysNFT && dataTokenJson.itemsByCategory.["key ring"].map((keyRingID, index) => (
                  <Row key={keyRingID}>
                    <Cell width={'400px'}>{keyRingID.substring(0, 18)}</Cell>
                    <Cell
                      textAlign='right'
                      isAction
                      onClick={() => navigate(
                        `/network/${network}/contract/${contract}/new/items/${keyRingID.substring(0, 18)}/pk/${privateKeysNFT[`keyRing${index}`]}`
                      )}
                    >
                      {
                        typeof arrayIsItem[keyRingID] === 'undefined' 
                          ? '...'
                          : arrayIsItem[keyRingID]
                            ? 'View'
                            : 'Create'
                      }
                    </Cell>
                  </Row>
                ))
              }
            </Table>
          </TabsItem>
        </Tabs>
      ) : (
        <Title>Loading Token Information...</Title>
      )}
    </Container>
  )
}

Token.propTypes = {
  network: PropTypes.string,
  contract: PropTypes.string,
  nonFungibleTokens: PropTypes.string,
  token: PropTypes.string
}

Token.defaultProps = {
  network: 'mainnet',
  contract: '0x00',
  nonFungibleTokens: '0x00',
  token: '0x00'
}

export default Token