import PropTypes from 'prop-types'
import React from 'react'
import { drizzleReactHooks } from '@drizzle/react-plugin'

const { useDrizzle } = drizzleReactHooks

const ETHAmount = ({ amount, decimals }) => {
  const { drizzle } = useDrizzle()
  return amount === null ||  amount === undefined ? (
    <span>?</span>
  ) : (
    Number(drizzle.web3.utils.fromWei(String(amount))).toFixed(decimals)
  )
}

ETHAmount.propTypes = {
  amount: PropTypes.oneOfType([
    PropTypes.string.isRequired,
    PropTypes.number.isRequired,
    PropTypes.object.isRequired
  ]),
  decimals: PropTypes.number
}

ETHAmount.defaultProps = {
  amount: null,
  decimals: 0
}

export default ETHAmount
