export const boardTypeDefs = `#graphql
  type Post {
    id: Int!
    title: String
    content: String
    format: String
    writer: String
    password: String
    created_at: String
    updated_at: String
    is_visible: Boolean
  }

  input CreatePostInput {
    title: String!
    content: String!
    format: String!
    writer: String!
    password: String!
    is_visible: Boolean
  }

  input UpdatePostInput {
    id: Int!
    title: String
    content: String
    format: String
    writer: String
    password: String
    is_visible: Boolean
  }

  input DeletePostInput {
    id: Int!
    password: String!
  }

  extend type Query {
    posts(board: String!): [Post!]!
    post(id: Int!, board: String!): Post
  }

  extend type Mutation {
    createPost(board: String!, input: CreatePostInput!): Post!
    updatePost(board: String!, input: UpdatePostInput!): Post!
    deletePost(board: String!, input: DeletePostInput!): Post!
  }
`;
