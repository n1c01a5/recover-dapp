import * as sigUtil from 'eth-sig-util'

export default ({from, data, signature}) => {
  const fromAddressComputed = sigUtil.recoverTypedSignature({ data, sig: signature })

  return fromAddressComputed === from
}