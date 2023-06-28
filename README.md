## athena-query

![tests](https://github.com/hawyar/athena-query/actions/workflows/test.yaml/badge.svg)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

### Usage

```bash
npm i athena-query
```

> @aws-sdk/credential-providers and @aws-sdk/client-athena are required as peer dependencies, make sure to install them as well.


```javascript
import { query } from 'athena-query'

const [columns, rows] = await query('select * from yourtable')

// with options
const [columns, rows] = await query('select * from yourtable', {
    region: 'us-east-1',
    output: 's3://yourbucket/athena-query-results',
    backoff: 2000 // milliseconds
})
```

### Options

- `region` - AWS region
- `profile` - AWS profile
- `workgroup` - Athena workgroup
- `output` - S3 bucket to store query results
- `backoff` - Backoff time in milliseconds


