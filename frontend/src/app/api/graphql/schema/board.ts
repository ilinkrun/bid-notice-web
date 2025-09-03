export const boardTypeDefs = `#graphql
  type Post {
    id: Int!
    title: String
    content: String
    markdown_source: String
    format: String
    writer: String
    password: String
    created_at: String
    updated_at: String
    is_visible: Boolean
  }

  type Comment {
    id: Int!
    board: String!
    post_id: Int!
    content: String!
    writer: String!
    created_at: String
    updated_at: String
    is_visible: Boolean
  }

  type CommentsResponse {
    total_count: Int!
    page: Int!
    per_page: Int!
    comments: [Comment!]!
  }

  input CreatePostInput {
    title: String!
    content: String!
    markdown_source: String
    format: String!
    writer: String!
    password: String!
    is_visible: Boolean
  }

  input UpdatePostInput {
    id: Int!
    title: String
    content: String
    markdown_source: String
    format: String
    writer: String
    password: String
    is_visible: Boolean
  }

  input DeletePostInput {
    id: Int!
    password: String!
  }

  input CreateCommentInput {
    board: String!
    post_id: Int!
    content: String!
    writer: String!
    password: String!
    is_visible: Boolean
  }

  input UpdateCommentInput {
    id: Int!
    content: String
    password: String!
    is_visible: Boolean
  }

  input DeleteCommentInput {
    id: Int!
    password: String!
  }

  extend type Query {
    posts(board: String!): [Post!]!
    post(id: Int!, board: String!): Post
    comments(board: String!, post_id: Int!, page: Int, per_page: Int): CommentsResponse!
    comment(id: Int!): Comment
  }

  extend type Mutation {
    createPost(board: String!, input: CreatePostInput!): Post!
    updatePost(board: String!, input: UpdatePostInput!): Post!
    deletePost(board: String!, input: DeletePostInput!): Post!
    createComment(input: CreateCommentInput!): Comment!
    updateComment(input: UpdateCommentInput!): Comment!
    deleteComment(input: DeleteCommentInput!): Comment!
  }
`;
