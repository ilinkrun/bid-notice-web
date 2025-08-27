export const noticeTypeDefs = `#graphql
  type Notice {
    nid: ID!
    title: String!
    orgName: String!
    region: String!
    detailUrl: String!
    category: String
    registration: String
    postedAt: String!
  }

  type NoticeStatistics {
    orgName: String!
    postedAt: String!
    category: String!
    region: String!
  }

  extend type Query {
    noticesByCategory(category: String!, gap: Int): [Notice!]!
    notices(gap: Int): [Notice!]!
    noticesStatistics(gap: Int): [NoticeStatistics]!
  }
`;
