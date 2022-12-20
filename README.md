## athena-query

![test](https://github.com/hawyar/node-lib-starter/actions/workflows/test.yml/badge.svg)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

### Usage

```bash
npm i athena-query
```

```javascript
import { query } from 'athena-query'
// const { query } = require('athena-query')

await query('SELECT * FROM my_table')

// with options:
// await query('SELECT * FROM my_table', {
//  database: 'default',
//  region: 'us-east-1',
//  profile: 'team-dev',
//  workgroup: 'etl'
//  bucket: 'my-super-bucket'
//  backoff: 3000
//  })
```
