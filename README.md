## athena-query

![tests](https://github.com/hawyar/athena-query/actions/workflows/test.yaml/badge.svg)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

### Usage

```bash
npm i athena-query
```

```javascript
import { query } from 'athena-query'

await query('SELECT * FROM my_table')

// options:

// await query('SELECT * FROM my_table', {
//  region: 'us-east-1',
//  profile: 'team-dev',
//  workgroup: 'etl'
//  output: 'my-super-bucket'
//  backoff: 3000
//  })
```
