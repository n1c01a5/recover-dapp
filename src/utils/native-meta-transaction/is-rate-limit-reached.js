// FIXME: check if on airtable base if the user account reach the number of transaction 30.
// increment for each new transaction
export default ({address}) => {
  return new Promise((resolve, reject) => {
    base('Clients').select({ // TODO: move this variable to a global variable.
      filterByFormula: `{Address} = '${address}'`
    }).firstPage(function (err, records) {
      if (err) {
        console.error(err)
        reject(err)
      }

      if (records && records.length === 0) resolve(false)
      else if (Array.isArray(records))
        records.forEach(record => resolve({
          metaTransactionsCount: record.get('Meta Transactions Count') // TODO: move this variable to a global variable.
          metaTransactionsLimit: record.get('Meta Transactions Limit') // TODO: move this variable to a global variable.
        }))
      else resolve(false)
    })
  })
}