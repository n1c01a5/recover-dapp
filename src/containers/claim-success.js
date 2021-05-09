import React, { useState, useEffect } from 'react'
import Web3 from 'web3'
import styled from 'styled-components/macro'

import { drizzleReactHooks } from '@drizzle/react-plugin'
import { useDataloader } from '../bootstrap/dataloader'
import RecoverABI from '../assets/contracts/recover.json'

const { useDrizzle } = drizzleReactHooks

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

const Message = styled.div`
  font-family: Nunito;
  font-size: 24px;
  line-height: 41px;
  color: #000;
  text-align: center;
  padding: 60px 0;
  @media (max-width: 768px) {
    padding: 1em;
    line-height: 24px;
    font-size: 20px;
  }
`

const Box = styled.div`
  font-family: Roboto;
  color: #444;
  background: #a6ffcc;
  border-radius: 5px;
  padding: 45px 0;
  text-align: center;
  margin: 0 114px 60px 114px;
  @media (max-width: 768px) {
    padding: 45px 0;
    margin: 0 0 40px 0;
  }
`

const TitleBox = styled.div`
  font-weight: bold;
  font-size: 40px;
  line-height: 60px;
  color: #444;
  font-weight: bold;
  @media (max-width: 768px) {
    font-size: 30px;
  }
`

const TypeBox = styled.div`
  white-space: pre-line;
  font-size: 24px;
  color: #000000;
  line-height: 40px;
  padding: 10px 0;
  color: #444;
`

export default ({network, itemID, pk}) => {
  const { useCacheCall } = useDrizzle()
  const loadDescription = useDataloader.getDescription()

  let contactInformation // FIXME: because of the dataloader I cannot use a `setState` the implementation of the dataloader is very tricky. Try to  bypass it.

  const [item, setItem] = useState()

  const [ethereum] = useState( // FIXME: do we need the `useState()`?
    new Web3(
      network === 'kovan'
        ? process.env.REACT_APP_WEB3_KOVAN_FALLBACK_URL 
        : network === 'mainnet'
          ? process.env.REACT_APP_WEB3_MAINNET_FALLBACK_URL
          : network === 'sokol'
            ? process.env.REACT_APP_WEB3_SOKOL_FALLBACK_URL
            : process.env.REACT_APP_WEB3_XDAI_FALLBACK_URL
    )
  )

  useEffect(() => {
    if(ethereum && ethereum.eth) {
      const RecoverEth = new ethereum.eth.Contract(
        RecoverABI.abi,
        network === 'kovan'
          ? process.env.REACT_APP_RECOVER_KOVAN_ADDRESS
          : network === 'mainnet'
            ? process.env.REACT_APP_RECOVER_MAINNET_ADDRESS
            : network === 'sokol'
              ? process.env.REACT_APP_RECOVER_SOKOL_ADDRESS
              : process.env.REACT_APP_RECOVER_XDAI_ADDRESS
      )

      const getItem = async () => await RecoverEth.methods.items(itemID.padEnd(66, '0')).call()

      getItem()
        .then(item => setItem(item))
      // TODO: send email "claim succeed"
    }
  }, [ethereum.eth.net])

  if ( // load meta-evidence
    item !== undefined
    && item.descriptionEncryptedLink !== undefined
  ) {
    const metaEvidence = loadDescription(
      item.descriptionEncryptedLink,
      pk
    )
    if (metaEvidence) contactInformation = metaEvidence.dataDecrypted.contactInformation
  } // TODO: add fallback `else`

  return (
    <Container>
      <Title>Claim Saved</Title>
      <Message>
        Congratulations!
        <br />Your claim is saved.
        <br />Contact the owner now:
      </Message>
      {contactInformation ? (
        <Box>
          <TitleBox>CONTACT OWNER</TitleBox>
          <TypeBox>{contactInformation}</TypeBox>
        </Box>
      ) : (
        <Title>Loading Contact Information...</Title>
      )}
    </Container>
  )
}
