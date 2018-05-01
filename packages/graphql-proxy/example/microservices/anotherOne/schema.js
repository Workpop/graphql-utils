export default `
schema {
  query: Query
  mutation: Mutation
}

type Mutation {
  changeHeroName: Boolean
}

# This is a FooBar type. It is really cool. VERSION:2.8.3
type Foo {
  foo: String @mock(type: fullName)
  bar: String
  baz: String
}

# The query type, represents all of the entry points into our object graph
type Query {
  foo: Foo
  anotherOneHero(region: Region): Character
  anotherOneCharacter(id: ID!): Character
  anotherOneHuman(id: ID!): Human
}
# The regions in the anotherOne world
enum Region {
  JOHTO
  KANTO
}
# A character from the anotherOne universe
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
# A humanoid creature from the anotherOne universe
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
