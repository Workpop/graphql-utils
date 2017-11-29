import { instrumentResolvers } from '@workpop/graphql-metrics';
import Logger from '@workpop/simple-logger';
import { get } from 'lodash';
import secureResolvers from './secureResolvers';

export default function createResolvers({
  svcName,
  resolvers,
  permissionChecks,
  instrumentationConfig = {},
}) {
  const logger = new Logger(`createResolvers for ${svcName}`);
  const logFunction = get(instrumentationConfig, 'logFunction');
  const logLevels = get(instrumentationConfig, 'logLevels');
  const Metrics = get(instrumentationConfig, 'Metrics');

  const securedResolvers = secureResolvers({
    svcName,
    resolvers,
    permissionChecks,
  });

  if (!Metrics) {
    logger.info(
      'No metrics passed in the instrumentation config, returning secured resolvers without instrumentation'
    );
    return securedResolvers;
  }

  logger.info(
    'Instrumentation Config provided, creating instrumented and secure resovlers'
  );
  return instrumentResolvers(securedResolvers, logFunction, logLevels, Metrics);
}
