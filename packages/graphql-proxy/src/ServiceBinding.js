import { keys } from 'lodash';
import { makeRemoteExecutableSchema } from 'graphql-tools';
import { Binding } from 'graphql-binding';
import ServiceLink from './ServiceTransport';

export default class Service extends Binding {
  constructor({ typeDefs, headers, address }) {
    const link = new ServiceLink({ headers, uri: address });

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
