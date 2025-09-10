export const authTypeDefs = `#graphql

  type User {
    id: String!
    email: String!
    name: String!
    role: String!
    department: String
    avatar: String
    isActive: Boolean!
    createdAt: String!
    lastLoginAt: String
  }

  type Session {
    id: String!
    userId: String!
    token: String!
    expiresAt: String!
    createdAt: String!
  }

  type AuthPayload {
    user: User
    token: String
    message: String
    success: Boolean!
  }

  extend type Query {
    currentUser(token: String!): User
    validateToken(token: String!): AuthPayload
  }

  extend type Mutation {
    login(email: String!, password: String!): AuthPayload
    logout(token: String!): AuthPayload
    register(input: RegisterInput!): AuthPayload
    requestPasswordReset(email: String!): AuthPayload
    resetPassword(token: String!, newPassword: String!): AuthPayload
    updateUserProfile(token: String!, input: UpdateUserInput!): AuthPayload
    updateUserPassword(token: String!, currentPassword: String!, newPassword: String!): AuthPayload
  }

  input RegisterInput {
    email: String!
    password: String!
    name: String!
    department: String
  }

  input UpdateUserInput {
    name: String
    department: String
  }
`;