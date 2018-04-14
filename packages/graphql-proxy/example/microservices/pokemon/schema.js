export default `
schema {
  query: Query
  mutation: Mutation
}

type Mutation {
  changeHeroName: Boolean
}

# This is a FooBar type. It is really cool. Yo VERSION:2.8.1
type Foo {
  foo: String
  bar: String
}

# The query type, represents all of the entry points into our object graph
type Query {
  foo: Foo
  pokemonHero(region: Region): Character
  pokemonCharacter(id: ID!): Character
  pokemonHuman(id: ID!): Human
}
# The regions in the Pokemon world
enum Region {
  JOHTO
  KANTO
}
# A character from the Pokemon universe
interface Character {
  # The ID of the character
  id: ID!
  # The name of the character
  name: String!
}
# Units of height
enum LengthUnit {
  # The standard unit around the world
  METER
  # Primarily used in the United States
  FOOT
}
# A humanoid creature from the Pokemon universe
type Human implements Character {
  # The ID of the human
  id: ID!
  # What this human calls themselves
  name: String!
  # Height in the preferred unit, default is meters
  height(unit: LengthUnit = METER): Float
  # Mass in kilograms, or null if unknown
  mass: Float
}
`;
