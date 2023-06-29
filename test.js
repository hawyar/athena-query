import tap from 'tap'
import { query } from './query.js'

tap.test('athena-query', async t => {
  t.test('throw if query is not provided', async t => {
    try {
      await query()
    } catch (error) {
      t.equal(error.message, 'query string is required (e.g. SELECT * FROM "sales" limit 10;)')
    }
  })

  t.test('basic query', async t => {
    const opt = {
      output: 'dundermifflinco-output'
    }

    if (!process.env.GITHUB_ACTIONS) {
      opt.profile = 'hawyar'
    }

    const stmt = `
    SELECT region, item_type, AVG(unit_price) AS avg_unit_price
    FROM "default"."sales"
    GROUP BY region, item_type;`

    const [columns, rows] = await query(stmt, opt)

    for (const row of rows) {
      t.ok(row.region)
      t.ok(row.item_type)
      t.ok(row.avg_unit_price)
    }

    t.equal(columns.length, 3)
  })

  t.test('query with output bucket', async t => {
    const opt = {
      output: 'dundermifflinco-output'
    }

    if (!process.env.GITHUB_ACTIONS) {
      opt.profile = 'hawyar'
    }

    const [columns, rows] = await query('SELECT * FROM "sales" where country = \'Tuvalu\'', opt)

    t.equal(rows[0].country, 'Tuvalu')
    t.equal(rows.length, 1)
    t.equal(columns.length, 14)
  })
  t.end()
})
