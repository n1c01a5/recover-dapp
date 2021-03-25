export default (base, tokenID) => {  // FIXME: abstract this function (base, table, address, query)
    return new Promise((resolve, reject) => {
      base('Loser Box NFT PKs').select({
        filterByFormula: `{ID} = '${tokenID}'`
      }).firstPage(function (err, records) {
        if (err) {
          console.error(err)
          reject(err)
        }
  
        if (records && records.length === 0) resolve(false)
        else if (Array.isArray(records))
          resolve({
            ownerAddress: records[0].get('Owner Address'),
            keyRing0: records[0].get('Key Ring'),
            card0: records[0].get('Card 1'),
            card1: records[0].get('Card 2'),
            sticker0: records[0].get('Sticker Round'),
            sticker1: records[0].get('Sticker Big 1'),
            sticker2: records[0].get('Sticker Big 2'),
            sticker3: records[0].get('Sticker Small')
          })
        else resolve(false)
      })
    })
  }