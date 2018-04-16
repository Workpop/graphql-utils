import bodyParser from 'body-parser';
import { makeExecutableSchema } from 'graphql-tools';
import { pick, omit, get } from 'lodash';
import { graphqlExpress, graphiqlExpress } from 'graphql-server-express';
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
  customHeaders = {},
  headersToForward,
  enableGraphiQL = true,
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
          headers: omit(get(context, 'headers'), 'cookie'),
        };
      },
    },
  });

  const schema = makeExecutableSchema({
    typeDefs: masterTypeDefs,
    resolvers: instrumentedResolvers,
  });

  server.use(
    '/graphql',
    bodyParser.json(),
    graphqlExpress(async (req) => {
      let logger;

      const requestId = req.headers['x-request-id'];

      if (requestId) {
        logger = new Logger('GRAPHQLPROXY', requestId);
      } else {
        logger = new Logger('GRAPHQLPROXY');
      }

      const options = {
        context: {},
        formatError:
          errorFormatter ||
          function (e) {
            logger.error(e.message);
            return {
              message: e.message,
            };
          },
      };

      if (requestId) {
        logger.info('Request Id:', requestId);
        options.context.requestId = requestId;
      }

      const userId = req.headers.userid || req.headers['wp-userid'];
      const cookie = req.headers.cookie;
      const forwardHeaders =
        headersToForward && pick(req.headers, ...headersToForward);

      if (userId) {
        logger.trace(`Recieving request from UserId ${userId}`);
        options.context.userId = userId;
      }

      // Attach headers to context that will be in downstream requests
      options.context.headers = {
        ...forwardHeaders,
        ...customHeaders,
        userId,
        requestId,
        'wp-userid': userId,
        cookie,
      };

      options.schema = schema;

      return options;
    })
  );

  if (enableGraphiQL) {
    server.use(
      '/graphiql',
      graphiqlExpress({
        endpointURL: '/graphql',
      })
    );
  }
}
