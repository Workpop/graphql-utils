# Mock Directive

In an effort to consolidate GraphQL mocks so that all clients (web, mobile, services) can benefit from schema first development, we are introducing a `mock` directive.

To take advantage of this directive on your GraphQL type include:

### Before
```
type User {
  _id: ID
  firstName: String
  lastName: String
}
```

### After
```
type User {
  _id: ID @mock(type: ID)
  firstName: String @mock(type: firstName)
  lastName: String @mock(type: lastName)
}
```

With these in place, if we make a request to a Roxy server with the header `gql-mock`, the server will respond with mock data for any fields that have this directive.

## How it works
We define our mock directive types [here]
We define a MockDirective [here]

Under the hood [faker.js](https://github.com/marak/Faker.js/) is substituting the value in its library based on the `type` argument provided to the mock directive.

## Adding new mocks

1. Define your enum in `mock__Types` via `mockDefinition.graphql`
2. Implement your type via `fakerDataBridge.js`
3. Decorate your GraphQL type with the directive.
