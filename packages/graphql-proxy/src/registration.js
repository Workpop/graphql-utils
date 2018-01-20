import bodyParser from 'body-parser';
import {
  introspectSchema,
  mergeSchemas,
  makeRemoteExecutableSchema,
} from 'graphql-tools';
import { parse } from 'graphql';
import { createApolloFetch } from 'apollo-fetch';
import { get, reduce, pick, keys, values, each, last, head } from 'lodash';
import { graphqlExpress, graphiqlExpress } from 'graphql-server-express';
import logger from './logger';
import { compareSemVer } from './utilities';

function parseVersion(version) {
  return last(version.split(':'));
}

function extractVersionFromDescription(description) {
  const version = description.match(/VERSION:(.*)$/gm);

  if (!!version) {
    return parseVersion(head(version));
  }
}

async function createIntrospection({ uri, introspectPromise }) {
  const schema = await introspectPromise;

  return {
    [uri]: schema,
  };
}

function introspectSchemas({ SERVICE_CONFIG, customHeaders }) {
  return reduce(
    SERVICE_CONFIG,
    (memo, currentVal) => {
      const uri = get(currentVal, 'address');
      const fetcher = createApolloFetch({ uri });
      fetcher.use(({ request, options }, next) => {
        if (!options.headers) {
          options.headers = {};
        }
        options.headers = customHeaders;

        next();
      });

      memo.push(
        createIntrospection({
          uri,
          introspectPromise: introspectSchema(fetcher),
        })
      );

      return memo;
    },
    []
  );
}

async function createSchemas({ SERVICE_CONFIG, customHeaders }) {
  const introspectionFromSchema = introspectSchemas({
    SERVICE_CONFIG,
    customHeaders,
  });

  const introspectionResults = await Promise.all(introspectionFromSchema);

  return reduce(
    introspectionResults,
    (memo, currentVal) => {
      const uri = head(keys(currentVal));
      const fetcher = createApolloFetch({ uri });
      fetcher.use(({ request, options = {} }, next) => {
        const headersFromReq = get(
          request,
          'context.graphqlContext.headers',
          {}
        );
        if (!options.headers) {
          options.headers = {};
        }
        options.headers = headersFromReq;

        next();
      });

      const remoteSchema = makeRemoteExecutableSchema({
        schema: head(values(currentVal)),
        fetcher,
      });

      const uriObj = {
        [uri]: remoteSchema,
      };

      return {
        ...uriObj,
        ...memo,
      };
    },
    {}
  );
}

function logSelectionSet(query) {
  const parsedQuery = parse(query);

  each(get(parsedQuery, 'definitions'), (definition) => {
    const selectionSet = get(definition, 'selectionSet');

    const selections = get(selectionSet, 'selections');

    each(selections, (selection) => {
      const value = get(selection, 'name.value');

      logger.info('Resolver name from selection set:', value);
    });
  });
}

export default async function registerServices({
  SERVICE_CONFIG,
  server,
  customHeaders = {},
  headersToForward,
  enableGraphiql = false,
  errorFormatter,
}) {
  const schemaDefs = await createSchemas({ SERVICE_CONFIG, customHeaders });
  const schemas = values(schemaDefs);

  let schema;

  try {
    schema = mergeSchemas({
      schemas,
      onTypeConflict: (leftType, rightType) => {
        const leftTypeVersion = extractVersionFromDescription(
          leftType && leftType.description
        );
        const rightTypeVersion = extractVersionFromDescription(
          rightType && rightType.description
        );

        if (leftTypeVersion && rightTypeVersion) {
          logger.info(
            'Versions found comparing',
            leftTypeVersion,
            rightTypeVersion
          );
          const versionComparison = compareSemVer(
            leftTypeVersion,
            rightTypeVersion
          );

          if (versionComparison === 1) {
            return leftType;
          }

          if (versionComparison === -1) {
            return rightType;
          }
        }

        if (!!leftTypeVersion && !rightTypeVersion) {
          logger.info('Only leftTypeVersion found', leftTypeVersion);
          return leftType;
        }

        if (!leftTypeVersion && !!rightTypeVersion) {
          logger.info('Only rightTypeVersion found', rightTypeVersion);
          return rightType;
        }

        logger.info('No versions found picking leftType');
        return leftType;
      },
    });

    server.use(
      '/graphql',
      bodyParser.json(),
      graphqlExpress(async (req) => {
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
  } catch (e) {
    return logger.error(e);
  }
}
