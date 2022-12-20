import tap from 'tap'
import { query } from './lib/athena.js'

tap.test('query', async t => {
  t.test('throw if no query is provided', async t => {
    try {
      await query()
    } catch (error) {
      t.equal(error.message, 'query string is required')
    }
  })

  t.test('throw if no bucket is provided', async t => {
    try {
      await query('SELECT * FROM "sales" limit 10;')
    } catch (error) {
      t.equal(error.message, 'output bucket is required')
    }
  })
  t.test('row and column', async t => {
    const { columns, rows } = await query('SELECT * FROM "sales" where country = \'Tuvalu\';', {
      database: 'default',
      workGroup: 'primary',
      profile: 'hawyar',
      bucket: 'dundermifflinco-output'
    })
    t.equal(rows[0].country, 'Tuvalu')
    t.equal(rows.length, 1)
    t.equal(columns.length, 14)
  })
  t.end()
})
