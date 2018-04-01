// This is the Star Wars schema used in all of the interactive GraphiQL
// examples on GraphQL.org. License reproduced at the bottom.

/**
 * Copyright (c) 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import express from 'express';
import bodyParser from 'body-parser';
import { graphqlExpress } from 'graphql-server-express';
import { makeExecutableSchema } from 'graphql-tools';
import schemaString from './schema';

/**
 * This defines a basic set of data for our Star Wars Schema.
 *
 * This data is hard coded for the sake of the demo, but you could imagine
 * fetching this data from a backend service rather than from hardcoded
 * JSON objects in a more complex demo.
 */

const humans = [
  {
    id: '1000',
    name: 'Luke Skywalker',
    friends: ['1002', '1003', '2000', '2001'],
    appearsIn: ['NEWHOPE', 'EMPIRE', 'JEDI'],
    height: 1.72,
    mass: 77,
    starships: ['3001', '3003'],
  },
  {
    id: '1001',
    name: 'Darth Vader',
    friends: ['1004'],
    appearsIn: ['NEWHOPE', 'EMPIRE', 'JEDI'],
    height: 2.02,
    mass: 136,
    starships: ['3002'],
  },
  {
    id: '1002',
    name: 'Han Solo',
    friends: ['1000', '1003', '2001'],
    appearsIn: ['NEWHOPE', 'EMPIRE', 'JEDI'],
    height: 1.8,
    mass: 80,
    starships: ['3000', '3003'],
  },
  {
    id: '1003',
    name: 'Leia Organa',
    friends: ['1000', '1002', '2000', '2001'],
    appearsIn: ['NEWHOPE', 'EMPIRE', 'JEDI'],
    height: 1.5,
    mass: 49,
    starships: [],
  },
  {
    id: '1004',
    name: 'Wilhuff Tarkin',
    friends: ['1001'],
    appearsIn: ['NEWHOPE'],
    height: 1.8,
    mass: null,
    starships: [],
  },
];

const humanData = {};
humans.forEach((ship) => {
  humanData[ship.id] = ship;
});

const droids = [
  {
    id: '2000',
    name: 'C-3PO',
    friends: ['1000', '1002', '1003', '2001'],
    appearsIn: ['NEWHOPE', 'EMPIRE', 'JEDI'],
    primaryFunction: 'Protocol',
  },
  {
    id: '2001',
    name: 'R2-D2',
    friends: ['1000', '1002', '1003'],
    appearsIn: ['NEWHOPE', 'EMPIRE', 'JEDI'],
    primaryFunction: 'Astromech',
  },
];

const droidData = {};
droids.forEach((ship) => {
  droidData[ship.id] = ship;
});

const starships = [
  {
    id: '3000',
    name: 'Millenium Falcon',
    length: 34.37,
  },
  {
    id: '3001',
    name: 'X-Wing',
    length: 12.5,
  },
  {
    id: '3002',
    name: 'TIE Advanced x1',
    length: 9.2,
  },
  {
    id: '3003',
    name: 'Imperial shuttle',
    length: 20,
  },
];

const starshipData = {};
starships.forEach((ship) => {
  starshipData[ship.id] = ship;
});

/**
 * Helper function to get a character by ID.
 */
function getCharacter(id) {
  // Returning a promise just to illustrate GraphQL.js's support.
  return Promise.resolve(humanData[id] || droidData[id]);
}

/**
 * Allows us to fetch the undisputed hero of the Star Wars trilogy, R2-D2.
 */
function getHero(episode) {
  if (episode === 'EMPIRE') {
    // Luke is the hero of Episode V.
    return humanData['1000'];
  }
  // Artoo is the hero otherwise.
  return droidData['2001'];
}

/**
 * Allows us to query for the human with the given id.
 */
function getHuman(id) {
  return humanData[id];
}

/**
 * Allows us to query for the droid with the given id.
 */
function getDroid(id) {
  return droidData[id];
}

function getStarship(id) {
  return starshipData[id];
}

function toCursor(str) {
  return Buffer(`cursor${str}`).toString('base64');
}

function fromCursor(str) {
  return Buffer.from(str, 'base64')
    .toString()
    .slice(6);
}

const resolvers = {
  Query: {
    hero: (root, { episode }) => { return getHero(episode); },
    character: (root, { id }) => { return getCharacter(id); },
    human: (root, { id }) => { return getHuman(id); },
    droid: (root, { id }) => { return getDroid(id); },
    starship: (root, { id }) => { return getStarship(id); },
    reviews: () => { return null; },
    search: (root, { text }) => {
      const re = new RegExp(text, 'i');

      const allData = [...humans, ...droids, ...starships];

      return allData.filter((obj) => { return re.test(obj.name); });
    },
  },
  Mutation: {
    createReview: (root, { episode, review }) => { return review; },
  },
  Character: {
    __resolveType(data, context, info) {
      if (humanData[data.id]) {
        return info.schema.getType('Human');
      }
      if (droidData[data.id]) {
        return info.schema.getType('Droid');
      }
      return null;
    },
  },
  Human: {
    height: ({ height }, { unit }) => {
      if (unit === 'FOOT') {
        return height * 3.28084;
      }

      return height;
    },
    friends: ({ friends }) => { return friends.map(getCharacter); },
    friendsConnection: ({ friends }, { first, after }) => {
      first = first || friends.length;
      after = after ? parseInt(fromCursor(after), 10) : 0;
      const edges = friends
        .map((friend, i) => {
          return ({
            cursor: toCursor(i + 1),
            node: getCharacter(friend),
          });
        })
        .slice(after, first + after);
      const slicedFriends = edges.map(({ node }) => { return node; });
      return {
        edges,
        friends: slicedFriends,
        pageInfo: {
          startCursor: edges.length > 0 ? edges[0].cursor : null,
          hasNextPage: first + after < friends.length,
          endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
        },
        totalCount: friends.length,
      };
    },
    starships: ({ starships }) => { return starships.map(getStarship); },
    appearsIn: ({ appearsIn }) => { return appearsIn; },
  },
  Droid: {
    friends: ({ friends }) => { return friends.map(getCharacter); },
    friendsConnection: ({ friends }, { first, after }) => {
      first = first || friends.length;
      after = after ? parseInt(fromCursor(after), 10) : 0;
      const edges = friends
        .map((friend, i) => {
          return ({
            cursor: toCursor(i + 1),
            node: getCharacter(friend),
          });
        })
        .slice(after, first + after);
      const slicedFriends = edges.map(({ node }) => { return node; });
      return {
        edges,
        friends: slicedFriends,
        pageInfo: {
          startCursor: edges.length > 0 ? edges[0].cursor : null,
          hasNextPage: first + after < friends.length,
          endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
        },
        totalCount: friends.length,
      };
    },
    appearsIn: ({ appearsIn }) => { return appearsIn; },
  },
  FriendsConnection: {
    edges: ({ edges }) => { return edges; },
    friends: ({ friends }) => { return friends; },
    pageInfo: ({ pageInfo }) => { return pageInfo; },
    totalCount: ({ totalCount }) => { return totalCount; },
  },
  FriendsEdge: {
    node: ({ node }) => { return node; },
    cursor: ({ cursor }) => { return cursor; },
  },
  Starship: {
    length: ({ length }, { unit }) => {
      if (unit === 'FOOT') {
        return length * 3.28084;
      }

      return length;
    },
  },
  SearchResult: {
    __resolveType(data, context, info) {
      if (humanData[data.id]) {
        return info.schema.getType('Human');
      }
      if (droidData[data.id]) {
        return info.schema.getType('Droid');
      }
      if (starshipData[data.id]) {
        return info.schema.getType('Starship');
      }
      return null;
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

server.listen(3007);

/*
License from https://github.com/graphql/graphql.github.io/blob/source/LICENSE

LICENSE AGREEMENT For graphql.org software

Facebook, Inc. (“Facebook”) owns all right, title and interest, including all
intellectual property and other proprietary rights, in and to the graphql.org
software. Subject to your compliance with these terms, you are hereby granted a
non-exclusive, worldwide, royalty-free copyright license to (1) use and copy the
graphql.org software; and (2) reproduce and distribute the graphql.org software
as part of your own software (“Your Software”). Facebook reserves all rights not
expressly granted to you in this license agreement.

THE SOFTWARE AND DOCUMENTATION, IF ANY, ARE PROVIDED "AS IS" AND ANY EXPRESS OR
IMPLIED WARRANTIES (INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE) ARE DISCLAIMED. IN NO
EVENT SHALL FACEBOOK OR ITS AFFILIATES, OFFICES, DIRECTORS OR EMPLOYEES BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
THE USE OF THE SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

You will include in Your Software (e.g., in the file(s), documentation or other
materials accompanying your software): (1) the disclaimer set forth above; (2)
this sentence; and (3) the following copyright notice:

Copyright (c) 2015, Facebook, Inc. All rights reserved.
*/
