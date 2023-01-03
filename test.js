import tap from 'tap'
import { query } from './lib/query.js'

tap.test('query', async t => {
  t.test('throw if no query is provided', async t => {
    try {
      await query()
    } catch (error) {
      t.equal(error.message, 'query string is required (e.g. SELECT * FROM "sales" limit 10;)')
    }
  })

  t.test('throw if no bucket is provided', async t => {
    try {
      await query('SELECT * FROM "sales" limit 10;')
    } catch (error) {
      t.equal(error.message, 'output location is required (e.g. s3://bucket/path)')
    }
  })
  t.test('row and column', async t => {
    const opt = {
      output: 'dundermifflinco-output'
    }

    if (!process.env.GITHUB_ACTIONS) {
      opt.profile = 'hawyar'
    }

    const { columns, rows } = await query('SELECT * FROM "sales" where country = \'Tuvalu\';', opt)
    t.equal(rows[0].country, 'Tuvalu')
    t.equal(rows.length, 1)
    t.equal(columns.length, 14)
  })
  t.end()
})
