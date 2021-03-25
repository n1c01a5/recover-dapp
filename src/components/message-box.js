import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components/macro'

const Box = styled.div`
  padding: 20px 15px 30px 15px;
  color: #444;
  background-color: ${({isWarning}) => isWarning ? '#FFC282' : '#FFF'};
  font-family: Roboto;
  border-radius: 10px;
  font-size: 24px;
  margin-bottom: 30px;
`

const MessageBox = ({
  isWarning,
  children,
  ...rest
}) => (
  <Box
    isWarning={isWarning}
    {...rest}
  >
    {children}
  </Box>
)

MessageBox.propTypes = {
  // State

  // Handlers

  // Modifiers
  isWarning: PropTypes.bool,

  // Rest
  children:  PropTypes.node
}

MessageBox.defaultProps = {
  // State

  // Handlers
  onClick: v => v,

  // Modifiers
  isWarning: true,

  // Rest
  children:  []
}

export default MessageBox