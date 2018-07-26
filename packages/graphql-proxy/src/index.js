import { pick, omit, identity, get, isNil } from 'lodash';
import { ApolloServer, gql } from 'apollo-server-express';
import Logger from '@workpop/simple-logger';
import { instrumentResolvers } from '@workpop/graphql-metrics';
import createServiceResolvers from './createServiceResolvers';

const ProxyLogger = new Logger('GRAPHQLPROXY');

const logLevels = {
  INFO: 'info',
  ERROR: 'error',
  WARNING: 'warning',
  TRACE: 'trace',
};

function _logFunction(logLevel, ...args) {
  ProxyLogger.log(logLevel, ...args);
}

export default async function registerServices({
  SERVICE_CONFIG,
  server,
  masterTypeDefs,
  formatResponse = identity,
  customHeaders = {},
  headersToForward,
  errorFormatter,
}) {
  const resolvers = createServiceResolvers({
    SERVICE_CONFIG,
    customHeaders,
  });

  const instrumentedResolvers = instrumentResolvers({
    resolvers,
    logFunc: _logFunction,
    logLevels,
    logOptions: {
      filterContext: (context = {}) => {
        return {
          ...context,
          headers: omit(get(context, 'headers'), 'cookie', 'authorization', 'wp-scifi'),
        };
      },
    },
  });

  const apolloServer = new ApolloServer({
    typeDefs: gql(masterTypeDefs),
    resolvers: instrumentedResolvers,
    formatError:
      errorFormatter ||
      function (e) {
        return {
          message: get(e, 'message'),
          validation: get(e, 'validation'),
        };
      },
    formatResponse,
    context: ({ req, res }) => {
      let logger;
      const requestId = req.headers['x-request-id'];

      if (requestId) {
        logger = new Logger('GRAPHQLPROXY', requestId);
      } else {
        logger = new Logger('GRAPHQLPROXY');
      }

      const options = {
        setCookie: (name, value, opts) => {
          res.cookie(name, value, opts);
        },
      };

      if (requestId) {
        logger.trace('Request Id:', requestId);
        options.requestId = requestId;
      }

      const userId = req.headers.userid || req.headers['wp-userid'];

      const cookie = req.headers.cookie;
      const forwardHeaders =
        headersToForward && pick(req.headers, ...headersToForward);

      // Attach headers to context that will be in downstream requests
      options.headers = {
        ...forwardHeaders,
        ...customHeaders,
        cookie,
      };

      if (!isNil(requestId)) {
        options.headers.requestId = requestId;
      }

      if (!isNil(userId)) {
        logger.trace(`Recieving request from UserId ${userId}`);
        options.userId = userId;
        options.headers.userId = userId;
        options.headers['wp-userid'] = userId;
      }

      return options;
    },
  });

  apolloServer.applyMiddleware({ app: server });
}
