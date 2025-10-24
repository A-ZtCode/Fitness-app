export const activityTypeDefs = `#graphql
  type Exercise {
    id: ID!
    username: String!
    exerciseType: String!
    description: String
    duration: Int!
    date: String!
    createdAt: String
    updatedAt: String
  }

  input AddExerciseInput {
    username: String!
    exerciseType: String!
    description: String
    duration: Int!
    date: String!
  }

  input UpdateExerciseInput {
    username: String!
    exerciseType: String!
    description: String
    duration: Int!
    date: String!
  }

  extend type Query {
    exercises: [Exercise!]!
    exercise(id: ID!): Exercise
  }

  extend type Mutation {
    addExercise(input: AddExerciseInput!): Exercise!
    updateExercise(id: ID!, input: UpdateExerciseInput!): Exercise!
    deleteExercise(id: ID!): String!
  }
`;
