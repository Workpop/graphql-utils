import schemaStringAnotherOne from './microservices/anotherOne/schema';
import schemaStringPokemon from './microservices/pokemon/schema';
import schemaStringSwapi from './microservices/swapi/schema';

export default {
  SWAPI: {
    address: 'http://localhost:3007/graphql',
    typeDefs: schemaStringSwapi,
  },
  POKEMON: {
    address: 'http://localhost:3008/graphql',
    typeDefs: schemaStringPokemon,
  },
  ANOTHERONE: {
    address: 'http://localhost:3010/graphql',
    typeDefs: schemaStringAnotherOne,
  },
};
