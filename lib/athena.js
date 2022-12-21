import { fromEnv, fromIni } from '@aws-sdk/credential-providers'
import { StartQueryExecutionCommand, GetQueryExecutionCommand, AthenaClient, GetQueryResultsCommand } from '@aws-sdk/client-athena'

let athena = null

/**
 * Query Athena
 * @param {string} raw - raw query string
 * @param {object} opt - options
 * @param {string} opt.database - database name
 * @param {string} opt.workgroup - work group
 * @param {string} opt.catalog - catalog
 * @param {string} opt.output - output location
 * @param {number} opt.backoff - backoff time
 * @param {string} opt.profile - aws profile
 * @param {string} opt.region - aws region
 * @returns {object} { columns, rows }
 * @example
 * const { columns, rows } = await query('SELECT * FROM "sales" limit 10;');
 *
 */
export async function query (raw, opt = {}) {
  if (!raw || typeof raw !== 'string') {
    throw new Error('query string is required (e.g. SELECT * FROM "sales" limit 10;)')
  }

  if (!opt.output) {
    throw new Error('output location is required (e.g. s3://bucket/path)')
  }

  opt.database = opt.database || 'default'
  opt.workgroup = opt.workgroup || 'primary'
  opt.catalog = opt.catalog || 'AwsDataCatalog'
  opt.backoff = opt.backoff || 1000
  opt.region = opt.region || 'us-east-2'

  let credentials = null

  if (opt.profile) {
    credentials = fromIni({
      profile: opt.profile
    })
  } else {
    credentials = fromEnv()
  }

  if (athena === null) {
    athena = new AthenaClient({
      region: opt.region,
      credentials
    })
  }

  const start = await athena.send(new StartQueryExecutionCommand({
    QueryString: raw,
    WorkGroup: opt.workgroup,
    QueryExecutionContext: {
      Database: opt.database || 'default',
      Catalog: opt.catalog || 'AwsDataCatalog'
    },
    ResultConfiguration: {
      OutputLocation: opt.output.startsWith('s3://') ? opt.output : `s3://${opt.output}`
    }
  }))

  if (start.$metadata.httpStatusCode !== 200) {
    throw new Error('failed query')
  }

  let retry = 0
  let backoff = opt.backoff

  const poll = async () => {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        const get = await athena.send(new GetQueryExecutionCommand({
          QueryExecutionId: start.QueryExecutionId
        }))

        if (get.$metadata.httpStatusCode !== 200) {
          reject(new Error('FailedQuery: unable to query Athena'))
        }

        if (get.QueryExecution.Status.State === 'SUCCEEDED') {
          resolve(get)
        } else if (get.QueryExecution.Status.State === 'FAILED') {
          console.log(get.QueryExecution)
          reject(new Error('FailedQuery: unable to query Athena'))
        } else if (get.QueryExecution.Status.State === 'CANCELLED') {
          reject(new Error('FailedQuery: unable to query Athena'))
        } else if (get.QueryExecution.Status.State === 'RUNNING' || get.QueryExecution.Status.State === 'QUEUED') {
          retry++
          backoff = opt.backoff + (retry * 100)
          poll().then(resolve).catch(reject)
        }
      }, backoff)
    })
  }

  await poll().catch(err => {
    throw new Error(err)
  })

  const output = await athena.send(new GetQueryResultsCommand({
    QueryExecutionId: start.QueryExecutionId
  }))

  if (output.$metadata.httpStatusCode !== 200) {
    throw new Error('FailedQuery: unable to query Athena')
  }

  const columns = output.ResultSet.ResultSetMetadata.ColumnInfo.map(c => {
    return {
      name: c.Name,
      type: c.Type
    }
  })

  output.ResultSet.Rows.shift()

  const rows = output.ResultSet.Rows.map((row) => {
    const record = {}

    row.Data.forEach((r, i) => {
      if (Object.keys(r).length === 0) {
        return
      }

      if (r.VarCharValue === null) {
        return
      }

      const type = columns[i].type

      if (type === 'date' || type === 'timestamp') {
        record[columns[i].name] = new Date(r.VarCharValue)
        return
      }

      if (type === 'tinyint' || type === 'smallint' || type === 'integer' || type === 'bigint') {
        record[columns[i].name] = parseInt(r.VarCharValue)
        return
      }

      if (type === 'double' || type === 'float' || type === 'decimal') {
        record[columns[i].name] = parseFloat(r.VarCharValue)
        return
      }

      if (type === 'boolean') {
        record[columns[i].name] = r.VarCharValue === 'true'
      }
      record[columns[i].name] = r.VarCharValue
    })
    return record
  })

  return {
    columns,
    rows
  }
}
