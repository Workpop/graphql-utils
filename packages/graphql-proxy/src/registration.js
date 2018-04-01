import bodyParser from 'body-parser';
import { makeExecutableSchema } from 'graphql-tools';
import { parse } from 'graphql';
import { get, pick, each } from 'lodash';
import { graphqlExpress, graphiqlExpress } from 'graphql-server-express';
import Logger from '@workpop/simple-logger';
import createServiceResolvers from './createServiceResolvers';

const ProxyLogger = new Logger('GRAPHQLPROXY');

function logSelectionSet(query) {
  const parsedQuery = parse(query);

  each(get(parsedQuery, 'definitions'), (definition) => {
    const selectionSet = get(definition, 'selectionSet');

    const selections = get(selectionSet, 'selections');

    each(selections, (selection) => {
      const value = get(selection, 'name.value');

      ProxyLogger.info('Resolver name from selection set:', value);
    });
  });
}

export default async function registerServices({
  SERVICE_CONFIG,
  server,
  masterTypeDefs,
  customHeaders = {},
  headersToForward,
  enableGraphiql = false,
  errorFormatter,
}) {
  const resolvers = createServiceResolvers({
    SERVICE_CONFIG,
    customHeaders,
  });

  const schema = makeExecutableSchema({
    typeDefs: masterTypeDefs,
    resolvers,
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
        context: {
          config: SERVICE_CONFIG,
        },
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

      const queryString = req.body.query;
      const operationName = req.body.operationName;
      const variables = req.body.variables;

      if (!!queryString) {
        logSelectionSet(queryString);
      }

      if (!!operationName) {
        logger.info('GraphQL Operation Name:', operationName);
      }
      if (!!variables) {
        logger.info('GraphQL Variables:', variables);
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

  if (enableGraphiql) {
    server.use(
      '/graphiql',
      graphiqlExpress({
        endpointURL: '/graphql',
      })
    );
  }
}
