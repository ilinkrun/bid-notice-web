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
    noticeCount: Int!
  }

  type NoticeRegionStatistics {
    region: String!
    noticeCount: Int!
  }

  extend type Query {
    noticesByCategory(category: String!, gap: Int): [Notice!]!
    notices(category: String, gap: Int): [Notice!]!
    noticesStatistics(gap: Int): [NoticeStatistics]!
    noticeRegionStatistics(gap: Int): [NoticeRegionStatistics]!
  }

  extend type Mutation {
    searchNotices(
      keywords: String!
      nots: String!
      minPoint: Float!
      addWhere: String
    ): [Notice]
    updateNoticeStatus(
      nid: String!
      status: String!
    ): UpdateResult
  }

  type UpdateResult {
    success: Boolean!
    message: String
  }
`;
