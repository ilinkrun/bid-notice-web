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
    mybidUpdate(input: MyBidInput!): MyBid
    mybidUpsert(input: MyBidInput!): MyBid
    mybidDelete(mid: Int!): Boolean
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
    category: String
    region: String
  }
`;
//# sourceMappingURL=mybids.js.map