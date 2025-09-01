export const bidTypeDefs = `#graphql
  type Bid {
    bid_id: String!
    title: String!
    org_name: String!
    posted_date: String!
    detail_url: String!
    status: String!
    bid_amount: Float
    deposit_amount: Float
    start_date: String
    end_date: String
    memo: String
    category: String
    region: String
  }

  extend type Query {
    myBids: [Bid!]!
    bidsByStatus(status: String!): [Bid!]!
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
