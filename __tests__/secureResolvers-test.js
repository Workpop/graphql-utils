import { expect } from 'chai';
import { secureResolvers } from '../packages/graphql-resolver-utils/src';

var err = new TypeError('Illegal salmon!');

const resolvers = {
  Query: {
    foobar() {
      return 'Hello World';
    },
  },
  Mutation: {
    setfoobar() {
      return 'Baz';
    },
    fooBaz() {
      return 'boo';
    },
  },
};

const permissionChecks = {
  foobar: () => {
    return true;
  },
  setfoobar: () => {
    throw err;
  },
};

const securedResolvers = secureResolvers({
  svcName: 'test',
  resolvers,
  permissionChecks,
});

describe('Secure Resolvers', function () {
  it('should allow calls to properly insecure resolvers', function () {
    expect(securedResolvers.Mutation.fooBaz).to.not.throw();
  });
  it('should allow calls to properly secured resolvers', function () {
    expect(securedResolvers.Query.foobar).to.not.throw();
  });
  it('should fail on calls that dont meet security conditions', function () {
    try {
      securedResolvers.Mutation.setfoobar();
    } catch (e) {
      expect(e).to.eql(err);
    }
  });
});
