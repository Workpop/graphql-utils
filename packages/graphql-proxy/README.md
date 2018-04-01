# GraphQL Proxy (Roxy)

A simple way to stitch GraphQL micro-services together under one GraphQL server.

## Background

One of the main benefits of GraphQL is that you can query all of your data as part of one schema, and get everything you need in one request. As you start building out a service oriented architecture with GraphQL you want to be able to develop/deploy your GraphQL server independently but still have that same great query experience.

Roxy uses the concept of 'schema-stitching' to combine multiple schemas from different GraphQL services to create one queryable GraphQL server. Schema stitching is the ability to create a single GraphQL schema from multiple underlying GraphQL APIs.

## Getting Started

`$ yarn add @workpop/graphql-proxy`

### Step 1: The Service Config

The first thing you need to create your GraphQL proxy is the uri's of your GraphQL APIs.

Create a service config like so:

```js
const SERVICE_CONFIG = {
  service1: {
    address: 'http://localhost:3000/graphql',
  },
  service2: {
    address: 'http://localhost:3000/graphql',
  },
};
```

Once we have our service's uri information configured, we need to supply the type definitions of each GraphQL api

```js
const SERVICE_CONFIG = {
  service1: {
    address: 'http://localhost:3000/graphql',
    typeDefs: service1TypeDefs,
  },
  service2: {
    address: 'http://localhost:3000/graphql',
    typeDefs: service2TypeDefs,
  },
};
```

We supply these type definitions so we can create "forwarding" resolvers. These are generated from reading the type definitions to understand what functions need to be executed.

### Step 2: registerServices

Next let's:

```js
import registerServices from '@workpop/graphql-proxy';
import express from 'express';
import masterTypeDefs from './typeDefs';

// Create an express server instance
const server = express();

registerServices({
  server,
  SERVICE_CONFIG,
  masterTypeDefs,
}).then(() => {
  server.listen(3020, () => {
    console.log('RUNNING ROXY');
  });
});
```

We call `registerServices` passing our `SERVICE_CONFIG` and express server. We also are passing a field `masterTypeDefs`. This represents the combination of all your GraphQL schemas into one master schema along with all type definitions in your system. This will create a GraphQL server that you can start querying!

We recommend managing your GraphQL types in a module outside your service, and to combine Root Schemas with this tool:
`merge-graphql-schemas`: https://github.com/okgrow/merge-graphql-schemas


## API

* `registerServices`

```js
type ServiceConfigType = {
  address: string // uri of service
  typeDefs: string // GraphQL schema string
}

type RegisterServiceType = {
  server: Express // express server
  SERVICE_CONFIG: { [serviceName: string]: ServiceConfigType } // map of services with their URIs and typedefs
  masterTypeDefs: string // The combined GraphQL schema string
  customHeaders: Object // Custom Headers to pass for every request. e.g. Basic Authorizaton
  headersToForward: Object // headers from the incoming request to forward to down stream services
  enableGraphiQL: boolean // Enable GraphiQL.
  errorFormatter: Function // Custom error formatter passed to the GraphQL express middleware
}
```
