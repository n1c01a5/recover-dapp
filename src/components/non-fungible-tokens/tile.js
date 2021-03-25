import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components/macro'
import { navigate } from '@reach/router'

import { ReactComponent as Plus } from '../../assets/images/plus.svg'

const StyledTile = styled.div`
  color: #14213d;
  background: #fff;
  overflow: hidden;
  font-family: Nunito;
  padding 47px 44px 0 44px;
  box-shadow: 0px 4px 50px rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  font-family: Nunito;
  font-size: 16px;
  &:hover {
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    transform: translate(0, -5px);
  }
`

const StyledTileNew = styled.div`
  background: rgba(255, 255, 255, 0.53);
  border: 7px solid rgba(255, 255, 255, 0.8);
  box-sizing: border-box;
  border-style: dashed;
  box-shadow: 0px 4px 50px rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  font-family: Nunito;
  font-weight: 600;
  font-size: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: #fff;
  &:hover {
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    transform: translate(0, -5px);
  }
`

const StyledTileTitle = styled.div`
  padding: 67px 0 35px 0;
`

const TokenCard = ({
  network,
  contract,
  nonFungibleTokens,
  token,
  isNewItem,
  isLoadingItem,
  className,
  onClick,
  children
}) => {
  return (
    <>
    {isNewItem ? (
      <StyledTileNew onClick={() => navigate(`/network/${network}/contract/${contract}/non-fungible-tokens`)}>
        <StyledTileTitle>Loser Box</StyledTileTitle>
        <div>
          <Plus />
        </div>
      </StyledTileNew>
    ) : isLoadingItem ? (
      <StyledTile>Loading...</StyledTile>
    ) : (
      <StyledTile onClick={onClick} className={`CardItem ${className}`}>
        {children}
      </StyledTile>
    )}
  </>
  )
}

TokenCard.propTypes = {
  network: PropTypes.string,
  contract: PropTypes.string,
  nonFungibleTokens: PropTypes.string,
  token: PropTypes.string,
  isNewItem: PropTypes.bool,
  isLoadingItem: PropTypes.bool,
  className: PropTypes.string,
  onClick: PropTypes.func,
  children: PropTypes.node
}

TokenCard.defaultProps = {
  network: 'mainnet',
  contract: '0x00',
  nonFungibleTokens: '0xEE',
  token: '0xFF',
  isNewItem: false,
  isLoadingItem: false,
  className: '',
  onClick: v => v,
  children: []
}

export default TokenCard