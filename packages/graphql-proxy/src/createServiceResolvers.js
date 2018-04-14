import { get, reduce } from 'lodash';
import ServiceBinding from './ServiceBinding';

function createResolver(fields, query) {
  return reduce(
    fields,
    (memo, currentVal) => {
      return {
        ...memo,
        [currentVal]: async (root, args, context, info) => {
          return await query[currentVal](args, context, info);
        },
      };
    },
    {}
  );
}

export default function createServiceResolvers({
  SERVICE_CONFIG,
  customHeaders,
}) {
  const serviceBindings = reduce(
    SERVICE_CONFIG,
    (memo, currentValue, key) => {
      const binding = new ServiceBinding({
        ...currentValue,
        headers: customHeaders,
      });

      return {
        ...memo,
        [key]: binding,
      };
    },
    {}
  );

  const serviceQueries = reduce(
    serviceBindings,
    (memo, currentVal) => {
      const fields = currentVal.queryFields();
      return {
        ...memo,
        ...createResolver(fields, get(currentVal, 'query')),
      };
    },
    {}
  );

  const serviceMutations = reduce(
    serviceBindings,
    (memo, currentVal) => {
      const fields = currentVal.mutationFields();
      return {
        ...memo,
        ...createResolver(fields, get(currentVal, 'mutation')),
      };
    },
    {}
  );

  return {
    Query: serviceQueries,
    Mutation: serviceMutations,
  };
}
