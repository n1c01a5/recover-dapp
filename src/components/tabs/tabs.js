import React, { createElement, useState, createContext, useContext } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components/macro'

import Tab from './tab'

const TabsContext = createContext({ setActiveTab: null })

const StyledTabList = styled.ul`
  display: flex;
  border-bottom: 1px solid #ccc;
  padding: 0 114px;
  font-family: Courier;
`

export default function Tabs ({ children }) {
  const [activeTab, setActiveTab] = useState(children[0].props.label)

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div>
        {/* className={`${styles.tabList}`} */}
        <StyledTabList > 
          {children.map((child) => (
            <Tab
              key={child.props.label}
              label={child.props.label}
            />
          ))}
        </StyledTabList>
      </div>
      <div
        // className={`${styles.tabContent} ${children[0].props.label !== activeTab ? styles.tabContentMask : ''}`}
      >
        {children.map((child) => {
          if (child.props.label !== activeTab) return undefined

          return child.props.children
        })}
      </div>
    </TabsContext.Provider>
  )
}

Tabs.propTypes = {
  children: PropTypes.instanceOf(Array).isRequired
}

Tabs.defaultProps = {
  children: [
    <TabsItem key='tab 1' label='tab 1' />,
    <TabsItem key='tab 2' label='tab 2' />
  ]
}

export function useTabContext () {
  return useContext(TabsContext)
}

export function TabsItem ({ children, label }) {
  return <div data-label={label}>{children}</div>
}