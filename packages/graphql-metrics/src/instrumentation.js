//@flow
import { get, isFinite, isFunction, mapValues, reduce } from 'lodash';
import { sanitizeArgs } from './sanitizeArgs';

const crypto = require('crypto');

function _elapsedTime(startHrtime: [number, number]): number {
  const diff = process.hrtime(startHrtime);
  return (diff[0] * 1000) + Math.round(diff[1] / 1000000); // return milliseconds
}

function _statusCodeForError(err: Error): number {
  const name = get(err, 'name');
  if (isFinite(name)) {
    return name;
  }

  const status = get(err, 'status');
  if (isFinite(status)) {
    return status;
  }

  const message = get(err, 'message');
  if (isFinite(message)) {
    return message;
  }

  if (isFinite(parseInt(message, 10))) {
    return parseInt(message, 10);
  }

  return 500;
}

type ImplementationType = {
  resolverName: string,
  resolverImpl: Function,
  logFunc: Function,
  logLevels: Object,
  metrics: Object,
  logOptions: Object,
};

function _createInstrumentedResolver({
  resolverName,
  resolverImpl,
  logFunc,
  logLevels,
  metrics,
  logOptions = {},
}: ImplementationType): Function {
  if (!!metrics) {
    metrics.addResolverMetric(resolverName);
  }

  const filterContext = get(logOptions, 'filterContext');

  return (
    root: Object,
    resolverArgs: Object,
    context: Object,
    info: Object
  ): ?any => {
    const startTime = process.hrtime();

    const requestId = get(context, 'requestId');

    let callId = crypto.randomBytes(16).toString('hex'); // used to correlate the start event and the completed event

    if (requestId) {
      callId = requestId;
    }

    const sanitizedArgs = sanitizeArgs(resolverArgs);

    let contextToLog = context;

    if (filterContext && isFunction(filterContext)) {
      contextToLog = filterContext(contextToLog);
    }

    const baseLogEvent = {
      callId,
      resolverName,
      resolverArgs: sanitizedArgs,
      context: contextToLog,
    };

    logFunc(logLevels.INFO, baseLogEvent);

    try {
      const retval = resolverImpl.call(null, root, resolverArgs, context, info);
      if (retval instanceof Promise) {
        return retval
          .then((promiseVal: ?any): Promise<*> => {
            const elapsedTime = _elapsedTime(startTime);
            logFunc(
              logLevels.INFO,
              Object.assign({}, baseLogEvent, {
                elapsedTime,
                status: 200,
              })
            );

            if (!!metrics) {
              metrics.logMetrics({
                resolverName,
                responseTime: elapsedTime,
                status: 200,
              });
            }

            return Promise.resolve(promiseVal);
          })
          .catch((promiseErr: Error): Promise<*> => {
            const elapsedTime = _elapsedTime(startTime);
            const status = _statusCodeForError(promiseErr);
            logFunc(
              get(promiseErr, 'level') || logLevels.ERROR,
              Object.assign({}, baseLogEvent, {
                elapsedTime,
                err: promiseErr,
                status,
              })
            );

            if (!!metrics) {
              metrics.logMetrics({
                resolverName,
                responseTime: elapsedTime,
                status,
              });
            }

            return Promise.reject(promiseErr);
          });
      }

      // non-promise
      const elapsedTime = _elapsedTime(startTime);
      logFunc(
        logLevels.INFO,
        Object.assign({}, baseLogEvent, {
          elapsedTime,
          status: 200,
        })
      );
      if (!!metrics) {
        metrics.logMetrics({
          resolverName,
          responseTime: elapsedTime,
          status: 200,
        });
      }

      return retval;
    } catch (err) {
      // non-promise
      const elapsedTime = _elapsedTime(startTime);
      const status = _statusCodeForError(err);
      logFunc(
        get(err, 'level') || logLevels.ERROR,
        Object.assign({}, baseLogEvent, {
          elapsedTime,
          err,
          status,
        })
      );
      if (!!metrics) {
        metrics.logMetrics({
          resolverName,
          responseTime: elapsedTime,
          status,
        });
      }

      throw err;
    }
  };
}

type InstrumentType = {
  resolvers: Object,
  logFunc: Function,
  logLevels: Object,
  metrics: Object,
  logOptions: Object,
};

/**
 * Instrument GraphQL resolvers object
 *
 * @param resolvers
 * @param logFunc
 * @returns {*}
 */
export default function instrumentResolvers({
  resolvers,
  logFunc,
  logLevels,
  metrics,
  logOptions = {},
}: InstrumentType): Object {
  if (!!metrics) {
    metrics.initMetrics();
    metrics.runMetricInterval();
  }

  // for each resolver type: Mutation, Query
  return mapValues(resolvers, (resolverFunctions: Object): Object => {
    // instrument each resolver function in the resolver type
    return reduce(
      resolverFunctions,
      (
        memo: { [id: string]: Function },
        resolverImpl: Function,
        resolverName: string
      ): Object => {
        return Object.assign({}, memo, {
          [resolverName]: _createInstrumentedResolver({
            resolverName,
            resolverImpl,
            logFunc,
            logLevels,
            metrics,
            logOptions,
          }),
        });
      },
      {}
    );
  });
}
