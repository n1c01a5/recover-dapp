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

  const [isModalOpen, setIsModalOpen] = useState(true)
  const [isMMOpen, setMMOpen] = useState(false)
  const [isNFTSignatureRejected, setIsNFTSignatureRejected] = useState(false)
  const [privateKeysNFT, setPrivateKeysNFT] = useState(null)
  const [isAlreadyAskForSign, setIsAlreadyAskForSign] = useState(false)
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
    if(network === 'mainnet' && drizzleState.networkID !== '1')
      navigate(`/network/kovan/contract/${nonFungibleTokens}`)
    else if (network === 'kovan' && drizzleState.networkID !== '42')
      navigate(`/network/mainnet/contract/${nonFungibleTokens}`)

    // NOTE: if the client does not injected web3, display the web3 modal.
    if (drizzleState.account === '0x0000000000000000000000000000000000000000')
      setMMOpen(true)
  }, [drizzleState])

  // useEffect(()=> { // FIXME: 111
  //   if (signatureNFTID)
  //     window.localStorage.setItem(
  //       'recover',
  //       JSON.stringify({
  //         ...JSON.parse(localStorage.getItem('recover') || '{}'),
  //         // `loserBoxNFT-${tokenID}`: {...}
  //       })
  //     )
  // }, [])

  // useEffect(() => {
  //   if(ethereum && ethereum.eth) {
  //     async function signNFTID() {

  //       const chainId = network === 'kovan' ? 42 : 1
  //       const accounts = await ethereum.eth.getAccounts()

  //       const domainType = [     
  //         { name: "name", type: "string" },     
  //         { name: "version", type: "string" },
  //         { name: "salt", type: "bytes32"}
  //       ]
  //       const messageType = [
  //         { name: "tokenID", type: "string" }
  //       ]
  //       const domainData = {
  //         name: "Loser Box NFT",
  //         version: "1",
  //         salt: '0x' + chainId.toString(16).padStart(64, '0')
  //       }

  //       const msgParams = {
  //         types: {
  //           EIP712Domain: domainType,
  //           Message: messageType
  //         },
  //         domain: domainData,
  //         primaryType: "Message",
  //         message: {
  //           tokenID
  //         }
  //       }

  //       await ethereum.currentProvider.send(
  //         {
  //            id: 1,
  //            method: "eth_signTypedData_v4",
  //            params: [accounts[0], JSON.stringify(msgParams)],
  //            from: accounts[0]
  //         },
  //         function(err, result) {
  //           if (err) {
  //             alert(
  //               'reject show again the box'
  //             )
  //               return console.error(err);
  //           }
  //           const signature = result.result.substring(2);
  //           const r = "0x" + signature.substring(0, 64);
  //           const s = "0x" + signature.substring(64, 128);
  //           const v = parseInt(signature.substring(128, 130), 16);

  //           setSignatureNFTID(signature)

  //           const from = accounts[0]

  //           const recovered = sigUtil.recoverTypedSignature_v4({
  //             data: msgParams,
  //             sig: '0x'+ signature
  //           })

  //           if (
  //             ethUtil.toChecksumAddress(recovered) === ethUtil.toChecksumAddress(from)
  //           ) {
  //             alert('Successfully recovered signer as ' + from);
  //           } else {
  //             alert(
  //               'Failed to verify signer when comparing ' + result + ' to ' + from
  //             )

  //           }
  //         }
  //       )
  //     }

  //     // if (!isAlreadyAskForSign)
  //     //   signNFTID()

  //     // setIsAlreadyAskForSign(true)
  //   }
  // }, [])

  const signNFT = useCallback(async () => {

    const chainId = network === 'kovan' ? 42 : 1
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

        if (ethUtil.toChecksumAddress(recovered) === ethUtil.toChecksumAddress(from)) { // TODO: add the same security in the lambda
          // TODO: add try catch to catch exception
          const resLoserBoxNFTPksRaw = await fetch(`/.netlify/functions/loser-box?network=${network}&tokenID=${tokenID}&msgParams=${encodeURI(JSON.stringify(msgParams))}&signatureNFTID=${signature}`)
          const resLoserBoxNFTPks = await resLoserBoxNFTPksRaw.json()

          setPrivateKeysNFT(resLoserBoxNFTPks.result)

          const loserBoxNFTPks = recoverLS.loserBoxNFTPks
          window.localStorage.setItem(
            'recover',
            JSON.stringify({
              ...recoverLS,
              loserBoxNFTPks: {
                ...loserBoxNFTPks,
                tokenID: resLoserBoxNFTPks
              }
            })
          )
          setIsModalOpen(false)
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
                    <Cell width={'400px'}>{stickerID}</Cell>
                    <Cell textAlign='right' isAction onClick={() => navigate(`/network/${network}/contract/${contract}/new/items/${stickerID}/pk/${privateKeysNFT[`sticker${index}`]}`)}>Create</Cell>
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
                privateKeysNFT && dataTokenJson.itemsByCategory.cards.map(cardID => (
                  <Row key={cardID}>
                    <Cell width={'400px'}>{cardID}</Cell>
                    <Cell textAlign='right' isAction onClick={() => navigate(`/network/${network}/contract/${contract}/new/items/${cardID}/pk/0xd37a245b6758fc4275da9182f7511eb8225b4447432f9b15c74de350fe850306`)}>Create</Cell>
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
                privateKeysNFT && dataTokenJson.itemsByCategory.["key ring"].map(keyRingID => (
                  <Row key={keyRingID}>
                    <Cell width={'400px'}>{keyRingID}</Cell>
                    <Cell textAlign='right' isAction onClick={() => navigate(`/network/${network}/contract/${contract}/new/items/${keyRingID}/pk/0xd37a245b6758fc4275da9182f7511eb8225b4447432f9b15c74de350fe850306`)}>Create</Cell>
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