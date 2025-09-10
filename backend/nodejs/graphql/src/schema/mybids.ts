export const mybidsTypeDefs = `#graphql
  type MyBid {
    mid: Int!
    nid: Int!
    title: String!
    status: String!
    startedAt: String
    endedAt: String
    memo: String
    orgName: String!
    postedAt: String!
    detail: String
    detailUrl: String
    category: String
    region: String
  }

  extend type Query {
    mybidsAll: [MyBid!]!
    mybidsByStatus(status: String!): [MyBid!]!
    mybidsOne(nid: Int!): MyBid
  }

  extend type Mutation {
    mybidCreate(input: MyBidInput!): MyBid
    mybidUpdate(input: MyBidUpdateInput!): UpdateResult
    mybidUpsert(input: MyBidInput!): MyBid
    mybidDelete(mid: Int!): Boolean
  }

  type UpdateResult {
    success: Boolean!
    message: String!
    nid: Int
    status: String
  }

  input MyBidInput {
    mid: Int
    nid: Int!
    title: String!
    status: String!
    startedAt: String
    endedAt: String
    memo: String
    orgName: String!
    postedAt: String!
    detail: String
    detailUrl: String
    category: String
    region: String
  }

  input MyBidUpdateInput {
    nid: Int!
    status: String!
    memo: String
    detail: String
  }
`;