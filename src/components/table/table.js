import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components/macro'

const StyledTable = styled.div`
  display: flex;
  flex-direction: column;
  padding: 30px 114px 0 114px;
`

const Table = ({ children }) => (<StyledTable>{children}</StyledTable>)

Table.propTypes = {
  children: PropTypes.node.isRequired
}

Table.defaultProps = {
  children: []
}

export default Table