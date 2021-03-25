import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components/macro'

import { useTabContext } from './tabs'

const StyledTabListItem = styled.li`
  flex: 1;
  font-family: Nunito;
  font-size: 24px;
  display: inline-block;
  list-style: none;
  margin-bottom: -1px;
  padding: 6px 13px;
  cursor: pointer;
  text-align: center;

  ${({ isActive }) => isActive && `
    border-bottom: 5px solid #12c2e9;
  `}
`

const Tab = ({ label }) => {
  const { activeTab, setActiveTab } = useTabContext()

  return (
    <StyledTabListItem
      isActive={activeTab === label}
      onClick={() => setActiveTab(label)}
    >
      {label}
    </StyledTabListItem>
  )
}

Tab.propTypes = {
  label: PropTypes.string.isRequired
}

Tab.defaultProps = {
  label: 'Tab 1'
}

export default Tab