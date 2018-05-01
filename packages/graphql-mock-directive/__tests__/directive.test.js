import { expect } from 'chai';
import { graphql } from 'graphql';
import { makeExecutableSchema } from 'graphql-tools';
import { mockDirective, MockDefinition } from '../src';

const typeDefs = [
  `
  type User {
    firstName: String @mock(type: firstName)
    lastName: String @mock(type: lastName)
  }

  type Query {
    currentUser: User
  }
`,
  MockDefinition,
];

const resolvers = {
  Query: {
    currentUser: () => {
      return {
        firstName: 'Zack',
        lastName: 'Flair',
      };
    },
  },
};

describe('Mock Directives', function () {
  it('should return the first name and last name when no directive is in schema', function () {
    const query = `{
      currentUser {
        firstName
        lastName
      }
    }`;

    const schema = makeExecutableSchema({ typeDefs, resolvers });

    return graphql(schema, query).then((result) => {
      expect(result.data.currentUser.firstName).to.eql('Zack');
    });
  });

  it('should return the first name and last name mocked directive is in schema', function () {
    const query = `{
      currentUser {
        firstName
        lastName
      }
    }`;

    const schema = makeExecutableSchema({
      typeDefs,
      resolvers,
      schemaDirectives: {
        mock: mockDirective,
      },
    });

    return graphql(schema, query).then((result) => {
      expect(result.data.currentUser.firstName).not.to.eql('Zack');
    });
  });
});
