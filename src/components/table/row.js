import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components/macro'

const StyledRow = styled.div`
  display: flex;
  flex-direction: row;

  ${({ isHeader }) => isHeader && `
    border-bottom: 1px solid gray;
    margin-bottom: 10px;
  `}
`

export const Row = ({ isHeader, children }) => (<StyledRow isHeader={isHeader}>{children}</StyledRow>)

Row.propTypes = {
  isHeader: PropTypes.bool,
  data: PropTypes.string.isRequired
}

Row.defaultProps = {
  isHeader: false,
  data: ''
}
