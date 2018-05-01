import faker from 'faker';

export default {
  Int: {
    defaultOptions: { min: 0, max: 99999 },
    generator: (options) => {
      options.precision = 1;
      return () => {
        return faker.random.number(options);
      };
    },
  },
  Float: {
    defaultOptions: { min: 0, max: 99999, precision: 0.01 },
    generator: (options) => {
      return () => {
        return faker.random.number(options);
      };
    },
  },
  String: {
    defaultOptions: {},
    generator: () => {
      return () => {
        return 'string';
      };
    },
  },
  Boolean: {
    defaultOptions: {},
    generator: () => {
      return () => {
        return faker.random.boolean();
      };
    },
  },
  ID: {
    defaultOptions: {},
    generator: () => {
      return () => {
        return faker.random.uuid();
      };
    },
  },
};
