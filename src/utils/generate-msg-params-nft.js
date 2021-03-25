const domainType = [     
  { name: "name", type: "string" },     
  { name: "version", type: "string" },
  { name: "salt", type: "bytes32"}
]
const messageType = [
  { name: "tokenID", type: "string" }
]

export default ({
  chainId,
  tokenID
}) => ({
  types: {
    EIP712Domain: domainType,
    Message: messageType
  },
  domain: {
    name: "Loser Box NFT",
    version: "1",
    salt: '0x' + chainId.toString(16).padStart(64, '0')
  },
  primaryType: "Message",
  message: {
    tokenID
  }
})