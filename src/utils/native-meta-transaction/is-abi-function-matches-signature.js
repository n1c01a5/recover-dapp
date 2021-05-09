/** This is the best way to import ethers, otherwise it throws errors */
const { ethers } = require('ethers');

export default ({
  functionAbi,
  functionName,
  functionSignature,
  functionParameters
}) => {
  const functionInterface = new ethers.utils.Interface(functionAbi)
  const functionAbiEncodingComputed = functionInterface.encodeFunctionData(
      functionName,
      functionParameters
  )

  return functionTransferAbiEncodingComputed === functionSignature
}