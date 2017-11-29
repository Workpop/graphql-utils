# @workpop/graphql-metrics

GraphQL-metrics instruments GraphQL resolvers, logging response times and statuses (if there was an error or not) to the console as well as to InfluxDB.

## Usage

To install:
```
yarn add @workpop/graphql-metrics
```

### Configuring the metrics logger
```javascript
import { WPGraphQLMetrics } from '@workpop/graphql-metrics';

const hostname = process.env.HOSTNAME;
const site = process.env.SITE;
const service = 'MyAwesomeGraphQLService';
const influxConfig = {
  host: process.env.INFLUX_HOST,
  port: parseInt(process.env.INFLUX_PORT, 10),
  protocol: process.env.INFLUX_PROTOCOL,
  username: process.env.INFLUX_USERNAME,
  password: process.env.INFLUX_PASSWORD,
  database: process.env.INFLUX_DATABASE,
  requestTimeout: parseInt(process.env.INFLUX_REQUEST_TIMEOUT, 10),
};

export const Metrics = new WPGraphQLMetrics({
  site,
  hostname,
  service,
  logFunc: console.log, // eslint-disable-line no-console
  metricIntervalMs: 60000,
  influxSettings: influxConfig,
});
```

### Instrumenting your resolvers
```javascript
import { instrumentResolvers } from '@workpop/graphql-metrics';
import { beersOnTap, pourBeer } from './resolvers';
import { Logger } from './log';

const logger = new Logger('WPGRAPHQL');

const logLevels = {
  INFO: 'info',
  ERROR: 'error',
  WARNING: 'warning',
  TRACE: 'trace',
};

function _logFunction(logLevel, ...args) {
  logger.log(logLevel, ...args);
}

const instrumentedResolvers = instrumentResolvers(
  {
    Query: {
      beersOnTap,
    },
    Mutation: {
      pourBeer,
    },
  },
  _logFunction,  // eslint-disable-line no-console
  logLevels,
  Metrics,
);

```

## Output

### Log Output
Each resolver invocation will produce 2 logs - one for start and one for completion.  A callId property is logged to allow correlation between the start and completion log for a single resolver invocation.  `elapsedTime` is measured in milliseconds.

Here are some sample logs:

Start log:
```
2017-07-21T18:09:51+00:00 INFO [WPGRAPHQL]
{
    "callId": "ca9f0dfc93455b7c8939fcb2e9f31404",
    "resolverName": "beersOnTap",
    "resolverArgs": {
        "search": "guiness"
    },
    "context": {
        "userId": "abc123"
    }
}
```

Completion log on success:
```
2017-07-21T18:09:51+00:00 INFO [WPGRAPHQL]
{
    "callId": "ca9f0dfc93455b7c8939fcb2e9f31404",
    "resolverName": "beersOnTap",
    "resolverArgs": {
        "search": "guiness"
    },
    "context": {
        "userId": "abc123"
    }
    "elapsedTime": 2,
    "status": 200
}
```

Completion log on error:
```
2017-07-21T18:09:51+00:00 INFO [WPGRAPHQL]
{
    "callId": "ca9f0dfc93455b7c8939fcb2e9f31404",
    "resolverName": "beersOnTap",
    "resolverArgs": {
        "search": "guiness"
    },
    "context": {
        "userId": "abc123"
    }
    "elapsedTime": 2,
    "status": 404,
    "err": "Beer named guiness not found"
}
```

### Data logged to InfluxDB
Metrics for each resolver are aggregated on a one minute interval and flushed to InfluxDB once per minute.
The following metrics are sent to InfluxDB for each resolver

```
${resolver}_count
${resolver}_4XX_count
${resolver}_5XX_count
${resolver}_total_response_time
${resolver}_ave_response_time
```
