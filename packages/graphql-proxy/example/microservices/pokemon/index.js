import express from 'express';
import bodyParser from 'body-parser';
import { graphqlExpress } from 'graphql-server-express';
import { makeExecutableSchema } from 'graphql-tools';

const schemaString = `
schema {
  query: Query
  mutation: Mutation
}

type Mutation {
  changeHeroName: Boolean
}

# This is a FooBar type. It is really cool. Yo VERSION:2.8.1
type Foo {
  foo: String
  bar: String
}

# The query type, represents all of the entry points into our object graph
type Query {
  foo: Foo
  pokemonHero(region: Region): Character
  pokemonCharacter(id: ID!): Character
  pokemonHuman(id: ID!): Human
}
# The regions in the Pokemon world
enum Region {
  JOHTO
  KANTO
}
# A character from the Pokemon universe
interface Character {
  # The ID of the character
  id: ID!
  # The name of the character
  name: String!
}
# Units of height
enum LengthUnit {
  # The standard unit around the world
  METER
  # Primarily used in the United States
  FOOT
}
# A humanoid creature from the Pokemon universe
type Human implements Character {
  # The ID of the human
  id: ID!
  # What this human calls themselves
  name: String!
  # Height in the preferred unit, default is meters
  height(unit: LengthUnit = METER): Float
  # Mass in kilograms, or null if unknown
  mass: Float
}
`;

/**
 * This defines a basic set of data for our Pokemon Schema.
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
 * Allows us to fetch the undisputed hero of the Pokemon trilogy, R2-D2.
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
    pokemonHero: (root, { region }) => { return getHero(region); },
    pokemonCharacter: (root, { id }) => { return getCharacter(id); },
    pokemonHuman: (root, { id }) => { return getHuman(id); },
  },
  Mutation: {
    changeHeroName: (root) => { return true; },
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
  graphqlExpress(async () => {
    const options = {
      schema,
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

server.listen(3008);
