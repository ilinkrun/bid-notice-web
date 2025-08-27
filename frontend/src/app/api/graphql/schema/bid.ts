export const bidTypeDefs = `#graphql
  type Bid {
    bid: Int
    nid: Int!
    status: String
    title: String
    started_at: String
    ended_at: String
    detail: JSON
    memo: String
    orgName: String
    category: String
    postedAt: String
    region: String
  }

  type Query {
    bidByStatus(status: String!): [Bid!]!
  }

  type Mutation {
    createBid(input: CreateBidInput!): Bid!
    updateBid(bid: Int!, input: UpdateBidInput!): Bid!
    deleteBid(bid: Int!): Boolean!
  }

  input CreateBidInput {
    nid: Int!
    status: String!
    title: String!
    started_at: String!
    ended_at: String!
    detail: JSON!
    memo: String
  }

  input UpdateBidInput {
    status: String
    title: String
    started_at: String
    ended_at: String
    detail: JSON
    memo: String
  }

  scalar JSON
`;
