import sinon from 'sinon';
import { expect } from 'chai';
import {
  instrumentResolvers,
  WPGraphQLMetrics,
} from '../packages/graphql-metrics/src';

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

describe('Instrumentation', function () {
  it('should call the Log Function', function () {
    const consoleStub = sinon.stub(logger, 'log');
    const stubResolvers = instrumentResolvers(
      {
        Query: {
          foobar() {
            return 'Hello World';
          },
        },
        Mutation: {
          setfoobar() {
            return 'Baz';
          },
        },
      },
      consoleStub,
      { INFO: 'info', ERROR: 'error' },
      Metrics
    );

    stubResolvers.Query.foobar();

    expect(consoleStub.called).to.be.ok;

    expect(consoleStub.calledWith('info')).to.be.ok;

    stubResolvers.Mutation.setfoobar();

    expect(consoleStub.called).to.be.ok;
    expect(consoleStub.calledWith('info')).to.be.ok;
  });
});
