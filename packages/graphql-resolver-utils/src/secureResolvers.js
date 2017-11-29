import Logger from '@workpop/simple-logger';
import { get, mapValues, reduce } from 'lodash';

function _createSecuredResolver({
  svcName,
  resolverName,
  resolverImpl,
  permissionChecks,
}) {
  const logger = new Logger(`${svcName} - permissions`);

  const permissionCheckFunc = get(permissionChecks, resolverName);
  if (!permissionCheckFunc) {
    logger.warn(`${resolverName} is unsecured`);
  } else {
    logger.info(`${resolverName} secured`);
  }

  return async (root, resolverArgs, context) => {
    logger.trace(`checking permissions for ${resolverName}`);
    if (permissionCheckFunc) {
      // following will throw with appropriate error
      try {
        await permissionCheckFunc.call(null, resolverArgs, context);
      } catch (e) {
        // log and rethrow
        logger.error(e);
        throw e;
      }
    } else {
      logger.warn(`${resolverName} is called unsecured`);
    }
    return resolverImpl.call(null, root, resolverArgs, context);
  };
}

export default function secureResolvers({
  svcName,
  resolvers,
  permissionChecks,
}) {
  // for each resolver type: Mutation, Query
  return mapValues(resolvers, (resolverFunctions) => {
    // instrument each resolver function in the resolver type
    return reduce(
      resolverFunctions,
      (memo, resolverImpl, resolverName) => {
        return Object.assign({}, memo, {
          [resolverName]: _createSecuredResolver({
            resolverName,
            resolverImpl,
            permissionChecks,
            svcName,
          }),
        });
      },
      {}
    );
  });
}
