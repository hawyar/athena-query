import { defaultProvider } from '@aws-sdk/credential-provider-node'
import { StartQueryExecutionCommand, GetQueryExecutionCommand, AthenaClient, GetQueryResultsCommand } from '@aws-sdk/client-athena'

const defaultQueryOutputBucket = 'casimir-etl-output-bucket-dev'
let athena = null

export async function query (raw) {
  if (!raw || typeof raw !== 'string') {
    throw new Error('InvalidQuery: query is not a string')
  }

  if (athena === null) {
    athena = new AthenaClient({
      region: 'us-east-2',
      credentials: defaultProvider()
    })
  }

  const start = new StartQueryExecutionCommand({
    QueryString: raw,
    WorkGroup: 'primary',
    QueryExecutionContext: {
      Database: 'default'
    },
    ResultConfiguration: {
      OutputLocation: `s3://${defaultQueryOutputBucket}/`
    }
  })

  const startResult = await athena.send(start)

  if (startResult.$metadata.httpStatusCode !== 200) {
    throw new Error('FailedQuery: unable to query Athena')
  }

  if (startResult.QueryExecutionId === undefined) {
    throw new Error('InvalidQueryExecutionId: query execution id is undefined')
  }

  let retry = 0
  let backoff = 500

  const poll = setInterval(async () => {
    const state = new GetQueryExecutionCommand({
      QueryExecutionId: startResult.QueryExecutionId
    })

    if (athena === null) {
      throw new Error('InvalidAthenaClient: athena client is null')
    }

    const stateResult = await athena.send(state)

    if (stateResult.$metadata.httpStatusCode !== 200) {
      throw new Error('FailedQuery: unable to query Athena')
    }

    if (stateResult.QueryExecution === undefined) {
      throw new Error('InvalidQueryExecution: query execution is undefined')
    }
    if (stateResult.QueryExecution.Status?.State) {
      if (stateResult.QueryExecution.Status.State === 'SUCCEEDED') {
        clearInterval(poll)
      } else if (stateResult.QueryExecution.Status.State === 'FAILED') {
        clearInterval(poll)
        throw new Error('FailedQuery: query failed')
      } else if (stateResult.QueryExecution.Status.State === 'CANCELLED') {
        clearInterval(poll)
        throw new Error('FailedQuery: query cancelled')
      } else {
        retry += 1
        backoff = Math.min(5000, retry * 500)
      }
    } else {
      throw new Error('InvalidQueryExecutionStatus: query execution status is undefined')
    }
  }, backoff)

  const result = new GetQueryResultsCommand({
    QueryExecutionId: startResult.QueryExecutionId
  })

  const getResult = await this.athena.send(result)

  if (getResult.$metadata.httpStatusCode !== 200) {
    throw new Error('FailedQuery: unable to query Athena')
  }

  if (getResult.ResultSet === undefined) {
    throw new Error('InvalidQueryResult: query result is undefined')
  }

  console.log(getResult)
  return getResult.ResultSet.Rows
}

async function testme () {
  const result = await query('SELECT * FROM "default"."sales" limit 10;')
  console.log(result)
}

testme().catch((err) => {
  console.log(err)
})
