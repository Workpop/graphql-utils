import { keys, get } from 'lodash';
import { setContext } from 'apollo-link-context';
import { makeRemoteExecutableSchema } from 'graphql-tools';
import { Binding } from 'graphql-binding';
import ServiceLink from './ServiceTransport';

export default class Service extends Binding {
  constructor({ typeDefs, headers, address }) {
    const http = new ServiceLink({
      headers: {},
      uri: address,
    });

    const link = setContext((request, previousContext) => {
      return ({
        headers: {
          ...headers,
          ...get(previousContext, 'graphqlContext.headers', {}),
        },
      });
    }).concat(http);

    const schema = makeRemoteExecutableSchema({
      schema: typeDefs,
      link,
    });

    super({ schema, fragmentReplacements: {} });
  }

  queryFields() {
    return keys(this.schema.getQueryType().getFields());
  }

  mutationFields() {
    return keys(this.schema.getMutationType().getFields());
  }
}
