import express from 'express';
import { get } from 'lodash';
import bodyParser from 'body-parser';
import { graphqlExpress } from 'graphql-server-express';
import { makeExecutableSchema } from 'graphql-tools';
import schemaString from './schema';

/**
 * This defines a basic set of data for our anotherOne Schema.
 *
 * This data is hard coded for the sake of the demo, but you could imagine
 * fetching this data from a backend service rather than from hardcoded
 * JSON objects in a more complex demo.
 */

const humans = [
  {
    id: '1000',
    name: 'Ash Ketchum',
    height: 1.72,
    mass: 77,
  },
  {
    id: '1001',
    name: 'Misty',
    height: 2.02,
    mass: 136,
  },
  {
    id: '1002',
    name: 'Brock',
    height: 1.8,
    mass: 80,
  },
  {
    id: '1003',
    name: 'Gary Oak',
    height: 1.5,
    mass: 49,
  },
];

/**
 * Helper function to get a character by ID.
 */
function getCharacter(id) {
  // Returning a promise just to illustrate GraphQL.js's support.
  return Promise.resolve(humanData[id]);
}

/**
 * Allows us to fetch the undisputed hero of the anotherOne trilogy, R2-D2.
 */
function getHero(region) {
  if (region === 'KANTO') {
    // Ash is the hero of Episode V.
    return humanData['1000'];
  }
  // Gary is the hero otherwise.
  return humanData['1003'];
}

/**
 * Allows us to query for the human with the given id.
 */
function getHuman(id) {
  return humanData[id];
}

const resolvers = {
  Query: {
    anotherOneHero: (root, { region }, context) => {
      console.log(context);
      return getHero(region);
    },
    anotherOneCharacter: (root, { id }) => {
      return getCharacter(id);
    },
    anotherOneHuman: (root, { id }) => {
      return getHuman(id);
    },
  },
  Mutation: {
    changeHeroName: (root) => {
      return true;
    },
  },
};

/**
 * Finally, we construct our schema (whose starting query type is the query
 * type we defined above) and export it.
 */
export const schema = makeExecutableSchema({
  typeDefs: [schemaString],
  resolvers,
});

const server = express();

server.use(
  '/graphql',
  bodyParser.json(),
  graphqlExpress(async (req) => {
    const headers = req.headers;

    console.log(req.headers);

    const userId = get(headers, 'userid') || get(headers, 'wp-userid');

    const options = {
      schema,
      context: {
        userId,
      },
      formatError: (e) => {
        return {
          name: e.name,
          level: e.level,
          message: e.message,
          locations: e.locations,
          path: e.path,
        };
      },
    };
    return options;
  })
);

server.use('/status', (req, res) => {
  res.status(200).send('OK');
});

server.listen(3010);
