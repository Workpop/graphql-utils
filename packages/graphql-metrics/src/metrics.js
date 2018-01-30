import Logger from '@workpop/simple-logger';
import { floor, forIn, get, isEmpty, reduce, toLower, unset } from 'lodash';
import { InfluxDB } from 'influx';

const logger = new Logger('GRAPHQL-METRICS');

const measurement = 'graphql_aggregated_response';

const aggregatedData = {};

const resolvers = [];

function _zeroData() {
  const initialDatum = {
    count: 0,
  };

  return reduce(
    resolvers,
    (memo, resolver) => {
      const resolverCountKey = toLower(`${resolver}_count`);
      const resolver4XXCountKey = toLower(`${resolver}_4XX_count`);
      const resolver5XXCountKey = toLower(`${resolver}_5XX_count`);
      const totalResponseTimeKey = toLower(`${resolver}_total_response_time`);
      const averageResponseTimeKey = toLower(`${resolver}_ave_response_time`);
      return {
        ...memo,
        [resolverCountKey]: 0,
        [totalResponseTimeKey]: 0,
        [averageResponseTimeKey]: 0,
        [resolver4XXCountKey]: 0,
        [resolver5XXCountKey]: 0,
      };
    },
    initialDatum
  );
}

function isInfluxConfigured(influxSettings) {
  return !isEmpty(get(influxSettings, 'database'));
}

export default class WPGraphQLMetrics {
  constructor({
    influxSettings,
    site,
    hostname,
    service,
    logFunc,
    metricIntervalMs = 60000,
    enableGraphQLMetrics = true,
  }) {
    this.resolvers = [];
    this.logFunc = logFunc;
    this.enableGraphQLMetrics = enableGraphQLMetrics;

    if (isInfluxConfigured(influxSettings)) {
      this.influx = new InfluxDB(influxSettings);
    } else {
      logger.warn(
        'Influx not properly configured - will not be sending metrics to Influx'
      );
      this.enableGraphQLMetrics = false;
    }
    this.site = site;
    this.hostname = hostname;
    this.service = service;
    this.metricIntervalMs = metricIntervalMs; // how often to flush aggregated metrics to influx
  }

  addResolverMetric(resolverName) {
    this.resolvers.push(resolverName);
  }

  initMetrics = () => {
    const firstInterval = this._currentInterval();
    aggregatedData[firstInterval] = _zeroData();
    aggregatedData[firstInterval + 1] = _zeroData();
  };

  runMetricInterval = () => {
    setInterval(this._flushMetrics, this.metricIntervalMs);
  };

  _currentInterval = () => {
    return Math.floor(Date.now() / this.metricIntervalMs);
  };

  _flushMetrics = () => {
    const currentInterval = this._currentInterval();

    // initialize the next interval
    const nextInterval = currentInterval + 1;
    aggregatedData[nextInterval] = _zeroData();

    const points = [];

    // flush and remove any previous metrics
    forIn(aggregatedData, (value, key) => {
      if (key < currentInterval) {
        points.push({
          timestamp: new Date(key * this.metricIntervalMs),
          measurement,
          tags: {
            site: this.site,
            hostname: this.hostname,
            service: this.service,
          },
          fields: value,
        });

        unset(aggregatedData, key);
      }
    });

    if (this.enableGraphQLMetrics) {
      this.influx.writePoints(points).catch((err) => {
        this.logFunc(
          'WPGRAPHQL',
          'ERROR',
          'Error sending data to InfluxDB',
          err
        );
      });
    }
  };

  logMetrics = ({ resolverName, responseTime, status }) => {
    if (!this.enableGraphQLMetrics) {
      return;
    }
    const currentInterval = this._currentInterval();
    const currentData = aggregatedData[currentInterval];
    if (currentData) {
      const countKey = 'count';
      const resolverCountKey = toLower(`${resolverName}_count`);
      const totalResponseTimeKey = toLower(
        `${resolverName}_total_response_time`
      );
      const averageResponseTimeKey = toLower(
        `${resolverName}_ave_response_time`
      );

      currentData[countKey] = 1 + get(currentData, countKey, 0);
      currentData[resolverCountKey] = 1 + get(currentData, resolverCountKey, 0);
      currentData[totalResponseTimeKey] =
        responseTime + get(currentData, totalResponseTimeKey, 0);
      currentData[averageResponseTimeKey] =
        currentData[totalResponseTimeKey] / currentData[resolverCountKey];

      // if it was an error, then increment 4XX or 5XX counters
      const statusXX = floor(status / 100);
      if (statusXX > 3) {
        const resolverStatusCountKey = toLower(
          `${resolverName}_${statusXX}XX_count`
        );
        currentData[resolverStatusCountKey] =
          1 + get(currentData, resolverStatusCountKey, 0);
      }
    }
  };
}
