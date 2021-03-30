import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components/macro'

const StyledCell = styled.div`
  font-family: Nunito;
  font-size: 20px;
  line-height: 40px;
  color: #444;
  width: ${({width}) => width || "auto"};
  text-align:  ${({textAlign}) => textAlign || "left"};

  ${({ isHeader }) => isHeader && `
    font-size: 18px;
    line-height: 30px;
    font-weight: bold;
    color: #ccc;
  `}

  ${({ isAction }) => isAction && `
  font-weight: bold;
  cursor: pointer;
`}
`

export const Cell = ({ isHeader, isAction, width, textAlign, onClick, children }) => (<StyledCell isHeader={isHeader} isAction={isAction} width={width} textAlign={textAlign} onClick={onClick}>{children}</StyledCell>)

Cell.propTypes = {
  isHeader: PropTypes.bool,
  isAction: PropTypes.bool,
  width: PropTypes.string,
  textAlign: PropTypes.string,
  onClick: PropTypes.func,
  children: PropTypes.node.isRequired
}

Cell.defaultProps = {
  isHeader: false,
  isAction: false,
  width: '100%',
  textAlign: 'left',
  onClick: v => v,
  children: []
}