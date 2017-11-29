import { expect } from 'chai';
import sinon from 'sinon';
import { WPGraphQLMetrics } from '../packages/graphql-metrics/src';
import { createResolvers } from '../packages/graphql-resolver-utils/src';

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

const logger = {
  log: (...args) => {
    return console.log(args); //eslint-disable-line no-console
  },
};

const Metrics = new WPGraphQLMetrics({
  site: 'www.hello.com',
  hostname: 'hello',
  logFunc: logger,
  metricIntervalMs: 6000,
});

describe('Create Resolvers w/o instrumentation', function () {
  const resolverMap = createResolvers({
    svcName: 'test',
    resolvers,
    permissionChecks,
  });
  it('should allow calls to properly insecure resolvers', function () {
    expect(resolverMap.Mutation.fooBaz).to.not.throw();
  });
  it('should allow calls to properly secured resolvers', function () {
    expect(resolverMap.Query.foobar).to.not.throw();
  });
  it('should fail on calls that dont meet security conditions', function () {
    try {
      resolverMap.Mutation.setfoobar();
    } catch (e) {
      expect(e).to.eql(err);
    }
  });
});

describe('Create Resolvers w/ instrumentation', function () {
  const consoleStub = sinon.stub(logger, 'log');
  const resolverMap = createResolvers({
    svcName: 'test',
    resolvers,
    permissionChecks,
    instrumentationConfig: {
      Metrics,
      logFunction: consoleStub,
      logLevels: { INFO: 'info', ERROR: 'error' },
    },
  });
  it('should call instrumentation w/ logs', function () {
    resolverMap.Query.foobar();

    expect(consoleStub.called).to.be.ok;

    expect(consoleStub.calledWith('info')).to.be.ok;

    resolverMap.Mutation.setfoobar();

    expect(consoleStub.called).to.be.ok;
    expect(consoleStub.calledWith('info')).to.be.ok;
  });

});
