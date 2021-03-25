export default (base, address) => {
  return new Promise((resolve, reject) => {
    base('Owners').select({
      filterByFormula: `{Address} = '${address}'`
    }).firstPage(function (err, records) {
      if (err) {
        console.error(err)
        reject(err)
      }

      if (records && records.length === 0) resolve(false)
      else if (Array.isArray(records))
        records.forEach(record => resolve({
          ID: record['id'],
          email: record.get('Email'),
          phoneNumber: record.get('Phone Number')
        }))
      else resolve(false)
    })
  })
}