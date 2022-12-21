## athena-query

![test](https://github.com/hawyar/node-lib-starter/actions/workflows/test.yml/badge.svg)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

### Usage

```bashj 
npm i athena-query
```

```javascript
import { query } from 'athena-query'
// const { query } = require('athena-query')

await query('SELECT * FROM my_table')

// and with options:
// await query('SELECT * FROM my_table', {
//  region: 'us-east-1',
//  profile: 'team-dev',
//  workgroup: 'etl'
//  output: 'my-super-bucket'
//  backoff: 3000
//  })
```
