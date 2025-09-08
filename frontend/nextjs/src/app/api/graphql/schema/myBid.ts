export const bidTypeDefs = `#graphql
  type Bid {
    mid: Int!
    nid: Int!
    title: String!
    status: String!
    started_at: String
    ended_at: String
    memo: String
    orgName: String!
    postedAt: String!
    detail: String
    category: String
    region: String
  }

  extend type Query {
    myBids: [Bid!]!
    bidByStatus(status: String!): [Bid!]!
    bidByNid(nid: Int!): Bid
  }

  extend type Mutation {
    createBid(input: CreateBidInput!): Bid!
    updateBidStatus(bidId: String!, status: String!): UpdateResult!
    deleteBid(bidId: String!): UpdateResult!
  }

  input CreateBidInput {
    title: String!
    org_name: String!
    detail_url: String!
    bid_amount: Float
    deposit_amount: Float
    start_date: String
    end_date: String
    memo: String
  }

  type UpdateResult {
    success: Boolean!
    message: String
  }

  scalar JSON
`;
