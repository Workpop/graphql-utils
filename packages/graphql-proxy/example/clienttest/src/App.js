import React, { Component } from 'react';
import './App.css';
import ApolloClient, { createNetworkInterface } from 'apollo-client';
import gql from 'graphql-tag';
import { ApolloProvider, graphql } from 'react-apollo';

const client = new ApolloClient({
  networkInterface: createNetworkInterface({
    uri: '/graphql',
  }),
  connectToDevTools: true,
});

const query = gql`
  {
    hero(episode: NEWHOPE) {
      name
    }
  }
`;

const PeopleContainer = graphql(query);

function Person({ name }) {
  return (
    <div style={{ flex: '1 0 300px' }}>
      <div
        style={{
          border: '1px solid rgba(0, 0, 0, 0.12)',
          padding: '24px',
        }}
      >
        <h1
          style={{
            fontSize: '14px',
            margin: '8px 0',
          }}
        >
          {name}
        </h1>
      </div>
    </div>
  );
}

let PeopleList = function PeopleList({ data }) {
  return (
    <div
      style={{
        maxWidth: '680px',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          flexWrap: 'wrap',
          display: 'flex',
        }}
      >
        {data.loading ? <p>People will be here soon</p> : <Person {...data.hero} />}
      </div>
    </div>
  );
};

PeopleList = PeopleContainer(PeopleList);

class App extends Component {
  render() {
    return (
      <ApolloProvider client={client}>
        <div className="App">
          <div className="App-header">
            <img
              src="https://cdn-images-1.medium.com/fit/t/1600/480/1*sxMljQ8wgso4cG3PxufTmQ.png"
              className="App-logo"
              alt="logo"
            />
            <h2>Your first GraphQL Component</h2>
          </div>
          <PeopleList />
        </div>
      </ApolloProvider>
    );
  }
}

export default App;
