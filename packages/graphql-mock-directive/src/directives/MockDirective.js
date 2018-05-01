import { SchemaDirectiveVisitor } from 'graphql-tools';
import { defaultFieldResolver } from 'graphql';
import { mockRegistry, typeMocks } from '../mocks';

export default class MockDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {

    const { resolve = defaultFieldResolver } = field;
    const { type } = this.args;
    field.resolve = async function (...args) {
      const result = await resolve.apply(this, args);

      if (!!type) {
        if (!!typeMocks[type]) {
          return typeMocks[type].generator()();
        }

        if (!!mockRegistry[type]) {
          return mockRegistry[type]();
        }
      }

      return result;
    };
  }
}
