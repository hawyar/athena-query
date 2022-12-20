import { defaultProvider } from '@aws-sdk/credential-provider-node'
import { StartQueryExecutionCommand, GetQueryExecutionCommand, AthenaClient, GetQueryResultsCommand } from '@aws-sdk/client-athena'

/**
 * Athena client
 */
let athena = null

/**
 * Query Athena
 * @param {string} raw - raw query string
 * @param {object} opt - options
 * @param {string} opt.database - database name
 * @param {string} opt.bucket - output bucket
 * @param {string} opt.profile - aws profile
 * @param {string} opt.workgroup - work group
 * @param {number} opt.backoff - backoff time
 * @returns {object} - query results
 * @example
 * const { columns, rows } = await query('SELECT * FROM "sales" limit 10;');
 *
 */
export async function query (raw, opt = {}) {
  if (!raw || typeof raw !== 'string') {
    throw new Error('query string is required')
  }

  if (!opt.bucket) {
    throw new Error('output bucket is required')
  }

  opt.database = opt.database || 'default'
  opt.profile = opt.profile || 'default'
  opt.region = opt.region || 'us-east-2'
  opt.profile = opt.profile || 500
  opt.workgroup = opt.workgroup || 'primary'

  if (athena === null) {
    athena = new AthenaClient({
      region: opt.region,
      credentials: defaultProvider({
        profile: opt.profile
      })
    })
  }

  const start = new StartQueryExecutionCommand({
    QueryString: raw,
    WorkGroup: opt.workgroup,
    QueryExecutionContext: {
      Database: opt.database || 'default'
    },
    ResultConfiguration: {
      OutputLocation: opt.bucket.startsWith('s3://') ? opt.bucket : `s3://${opt.bucket}`
    }
  })

  const startResult = await athena.send(start)

  if (startResult.$metadata.httpStatusCode !== 200) {
    throw new Error('FailedQuery: unable to query Athena')
  }

  let retry = 0
  let backoff = opt.backoff

  const poll = async () => {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        const get = new GetQueryExecutionCommand({
          QueryExecutionId: startResult.QueryExecutionId
        })

        const getResult = await athena.send(get)

        if (getResult.$metadata.httpStatusCode !== 200) {
          reject(new Error('FailedQuery: unable to query Athena'))
        }

        if (getResult.QueryExecution.Status.State === 'SUCCEEDED') {
          resolve(getResult)
        } else if (getResult.QueryExecution.Status.State === 'FAILED') {
          console.log(getResult.QueryExecution)
          reject(new Error('FailedQuery: unable to query Athena'))
        } else if (getResult.QueryExecution.Status.State === 'CANCELLED') {
          reject(new Error('FailedQuery: unable to query Athena'))
        } else if (getResult.QueryExecution.Status.State === 'RUNNING' || getResult.QueryExecution.Status.State === 'QUEUED') {
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

  const result = new GetQueryResultsCommand({
    QueryExecutionId: startResult.QueryExecutionId
  })

  const output = await athena.send(result)

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

  const rows = output.ResultSet.Rows.map((row, i) => {
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
