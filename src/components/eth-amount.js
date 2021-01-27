import PropTypes from 'prop-types'
import React from 'react'
import {default as ethereum} from 'web3'

const ETHAmount = ({ amount, decimals }) => {
  return amount === null ||  amount === undefined ? (
    <span>?</span>
  ) : (
    Number(
      ethereum.utils.fromWei(
        typeof amount === 'number'
          ? amount.toLocaleString('fullwide', { useGrouping: false })
          : String(amount)
      )
    ).toFixed(decimals)
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
