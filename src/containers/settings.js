import PropTypes from 'prop-types'
import React, { useEffect, useState, useCallback } from 'react'
import styled from 'styled-components/macro'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import { navigate } from '@reach/router'
import ReactPhoneInput from 'react-phone-input-2'
import { drizzleReactHooks } from '@drizzle/react-plugin'

import CONSTANTS from '../constants'
import Button from '../components/button'

import 'react-phone-input-2/lib/style.css'

const { useDrizzle, useDrizzleState } = drizzleReactHooks

const Box = styled.div`
  display: flex;
  align-items: center;
  margin-top: 50px;
  color: #444;
  background-color: #a6ffcb;
  background-repeat: no-repeat;
  background-position: center;
  overflow: hidden;
  font-family: Roboto;
  padding: 0 40px;
  border-radius: 10px;
  font-size: 24px;
  height: 100px;
  overflow: hidden;
`

const Container = styled.div`
  font-family: Nunito;
  color: #444;
  margin: 0 126px;
  padding: 77px 104px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0px 4px 50px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  @media (max-width: 768px) {
    padding: 2em 3em;
    margin: 0;
  }
`

const Title = styled.h2`
  font-family: Nunito;
  font-size: 40px;
  color: #14213d;
  padding-bottom: 20px;
`

const FieldContainer = styled.div`
  margin: 20px 0;
`

const Error  = styled.div`
  color: red;
  font-family: Roboto;
  font-size: 14px;
`

const StyledLabel  = styled.label`
  font-family: Roboto;
  color: #5c5c5c;
  font-size: 16px;
  line-height: 19px;
`

const StyledField = styled(Field)`
  line-height: 50px;
  padding-left: 20px;
  margin: 10px 0;
  width: 100%;
  display: block;
  background: #fff;
  border: 1px solid #ccc;
  box-sizing: border-box;
  border-radius: 5px;
`

const StyledForm = styled(Form)`
  display: flex;
  flex-direction: column;
`

const Submit = styled.div`
  margin-top: 30px;
  text-align: right;
`

const Settings = ({ network, contract }) => {
  const recover = JSON.parse(localStorage.getItem('recover') || '{}')

  const [isSaved, setIsSaved] = useState(false)

  const { drizzle } = useDrizzle()
  const drizzleState = useDrizzleState(drizzleState => ({
    account: drizzleState.accounts[0]
      ? drizzleState.accounts[0].toString()
      : '0x0000000000000000000000000000000000000000',
    ID: `${drizzleState.accounts[0]}-${drizzleState.web3.networkId}`,
    networkID: drizzleState.web3.networkId
      ? drizzleState.web3.networkId.toString()
      : '1',
    transactions: drizzleState.transactions
  }))

  useEffect(() => {
    if(network === 'mainnet' && drizzleState.networkID !== '1')
      navigate(`/network/kovan/contract/${process.env.REACT_APP_RECOVER_KOVAN_ADDRESS}`)
    else if (network === 'kovan' && drizzleState.networkID !== '42')
      navigate(`/network/mainnet/contract/${process.env.REACT_APP_RECOVER_MAINNET_ADDRESS}`)
  }, [drizzleState])

  const addSettings = useCallback(({
      address,
      signMsg,
      email,
      phoneNumber,
      fundClaims,
      timeoutLocked
    }) => {
      fetch('/.netlify/functions/settings', {
        method: 'POST',
        body: JSON.stringify({
          network,
          address,
          signMsg,
          email: email !== '' ? email : '',
          phoneNumber: phoneNumber !== '' ? phoneNumber : ''
        })
      })
      .then(res => res.json())
      .then(data => {
        if(data.result === (CONSTANTS.LAMBDA__SETTINGS_ADDED || CONSTANTS.LAMBDA__SETTINGS_UPDATED)) {
          window.localStorage.setItem('recover', JSON.stringify({
            ...JSON.parse(localStorage.getItem('recover') || '{}'),
            [drizzleState.ID]: {
              email,
              phoneNumber,
              fundClaims,
              timeoutLocked
            }
          }))

          setIsSaved(true)
        }
        // TODO: if error, render error on the UI
      }).catch(err => console.error(err))
  })

  // TODO: add fallback
  return (
    <Container>
      <Title>Settings</Title>
      <Formik
        initialValues={{
          email: (recover[drizzleState.ID] && recover[drizzleState.ID].email) || '',
          phoneNumber: (recover[drizzleState.ID] && recover[drizzleState.ID].phoneNumber) || '',
          fundClaims: (recover[drizzleState.ID] && recover[drizzleState.ID].fundClaims) || 0.015,
          timeoutLocked: (recover[drizzleState.ID] && recover[drizzleState.ID].timeoutLocked) || 604800
        }}
        validate={values => {
          let errors = {}
          if (!values.email)
            errors.email = 'Email Required'
          if (
            values.email !== '' &&
            !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)
          )
            errors.email = 'Invalid email address'
          if (isNaN(values.fundClaims))
            errors.fundClaims = 'Number Required'
          if (values.fundClaims <= 0)
            errors.fundClaims = 'Amount of the fund claims must be positive.'
          if (isNaN(values.timeoutLocked))
            errors.timeoutLocked = 'Number Required'
          if (values.timeoutLocked <= 0)
            errors.timeoutLocked = 'Timeout locked must be positive.'

          return errors
        }}

        onSubmit={async values => {
          const signMsg = await drizzle.web3.eth.personal.sign(
            `Signature required to check if your are the owner of this address: ${drizzleState.account}`,
            drizzleState.account
          )

          addSettings({
            address: drizzleState.account,
            signMsg,
            email: values.email,
            phoneNumber:values.phoneNumber,
            fundClaims: values.fundClaims,
            timeoutLocked: values.timeoutLocked
          })
        }}
      >
        {({
          touched,
          errors,
          setFieldValue,
          values
        }) => (
          <>
            <StyledForm>
              <FieldContainer>
                <StyledLabel htmlFor="email">
                  <span
                    className="info"
                    aria-label="Your email to be notified if there is a claim on one of your items."
                  >
                    Email
                  </span>
                </StyledLabel>
                <StyledField
                  name="email"
                  placeholder="Email"
                />
                <ErrorMessage
                  name="email"
                  component={Error}
                />
              </FieldContainer>
              <FieldContainer>
                <StyledLabel htmlFor="phoneNumber">
                  <span
                    className="info"
                    aria-label="Your phone number to be notified by SMS if there is a claim on one of your items."
                  >
                    Phone Number
                  </span>
                </StyledLabel>
                <ReactPhoneInput
                  value={values.phoneNumber}
                  onChange={phoneNumber => setFieldValue('phoneNumber', phoneNumber)}
                  containerStyle={{
                    margin: '10px 0',
                    lineHeight: '50px',
                    boxSizing: 'border-box',
                    border: '1px solid #ccc !important',
                  }}
                  inputStyle={{
                    height: '52px',
                    width: '100%',
                    boxSizing: 'border-box',
                    color: '#222',
                    font: '400 15px Nunito'
                  }}
                  inputExtraProps={{
                    name: 'phoneNumber'
                  }}
                />
                <ErrorMessage
                  name="phoneNumber"
                  component={Error}
                />
              </FieldContainer>
              <FieldContainer>
                <StyledLabel htmlFor="fundClaims">
                  <span
                    className="info"
                    aria-label="
                      The amount sent to the wallet finder to pay the gas to claim without ETH.
                      It's a small amount of ETH.
                    "
                  >
                    Fund Claims (ETH)
                  </span>
                </StyledLabel>
                <StyledField
                  name="fundClaims"
                  placeholder="PreFund Gas Cost to Claim"
                />
                <ErrorMessage
                  name="fundClaims"
                  component={Error}
                />
              </FieldContainer>
              <FieldContainer>
                <StyledLabel htmlFor="timeoutLocked">
                  <span
                    className="info"
                    aria-label="
                      Time in seconds after which the finder from whom his claim was accepted
                      may force the payment of the reward if there is no dispute flow.
                    "
                  >
                    Time Locked (seconds)
                  </span>
                </StyledLabel>
                <StyledField
                  name="timeoutLocked"
                  placeholder="Timeout locked"
                />
                <ErrorMessage
                  name="timeoutLocked"
                  component={Error}
                />
              </FieldContainer>
              <Submit>
                <Button
                  type="submit"
                  disabled={
                    Object.entries(touched).length === 0
                    && touched.constructor === Object
                    || Object.entries(errors).length > 0
                  }
                >
                  Save Settings
                </Button>
              </Submit>
            </StyledForm>
          </>
        )}
      </Formik>
      {
        isSaved && (
          <Box>
            Settings updated
          </Box>
        )
      }
    </Container>
  )
}

Settings.propTypes = {
  network: PropTypes.string
}

Settings.defaultProps = {
  network: 'mainnet'
}

export default Settings
