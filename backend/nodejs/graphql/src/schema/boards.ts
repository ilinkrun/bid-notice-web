export const boardsTypeDefs = `#graphql
  type BoardPost {
    id: Int!
    title: String
    content: String
    markdown_source: String
    format: String
    writer: String
    email: String
    created_at: String
    updated_at: String
    is_visible: Boolean
  }

  type BoardComment {
    id: Int!
    board: String!
    post_id: Int!
    content: String!
    writer: String!
    email: String
    created_at: String
    updated_at: String
    is_visible: Boolean
  }

  type BoardCommentsResponse {
    total_count: Int!
    page: Int!
    per_page: Int!
    comments: [BoardComment!]!
  }

  input BoardPostInput {
    id: Int
    title: String!
    content: String!
    markdown_source: String
    format: String!
    writer: String!
    email: String!
    is_visible: Boolean
  }

  input BoardCommentInput {
    id: Int
    board: String!
    post_id: Int!
    content: String!
    writer: String!
    email: String!
    is_visible: Boolean
  }

  input BoardPostDeleteInput {
    id: Int!
    email: String!
  }

  input BoardCommentDeleteInput {
    id: Int!
    email: String!
  }

  extend type Query {
    boardsPostsAll(board: String!): [BoardPost!]!
    boardsPostsOne(id: Int!, board: String!): BoardPost
    boardsCommentsAll(board: String!, post_id: Int!, page: Int, per_page: Int): BoardCommentsResponse!
    boardsCommentsOne(id: Int!): BoardComment
  }

  extend type Mutation {
    boardsPostCreate(board: String!, input: BoardPostInput!): BoardPost!
    boardsPostUpdate(board: String!, input: BoardPostInput!): BoardPost!
    boardsPostDelete(board: String!, input: BoardPostDeleteInput!): BoardPost!
    boardsCommentCreate(input: BoardCommentInput!): BoardComment!
    boardsCommentUpdate(input: BoardCommentInput!): BoardComment!
    boardsCommentDelete(input: BoardCommentDeleteInput!): BoardComment!
  }
`;
