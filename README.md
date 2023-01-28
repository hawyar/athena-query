## athena-query

![tests](https://github.com/hawyar/athena-query/actions/workflows/test.yaml/badge.svg)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

### Usage

<!-- ```bash
npm i athena-query
``` -->

```javascript
import { query } from 'athena-query'

const [columns, rows] = await query('select id, name from my_supertable')
```

### Options

- `region` - AWS region
- `profile` - AWS profile
- `workgroup` - Athena workgroup
- `output` - S3 bucket to store query results
- `backoff` - Backoff time in milliseconds


