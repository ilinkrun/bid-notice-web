export const noticeTypeDefs = `#graphql
  type Notice {
    nid: Int!
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
    category: String
    region: String
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
    searchNotices(
      keywords: String!
      nots: String!
      minPoint: Float!
      addWhere: String
    ): [Notice]
    lastNotice(orgName: String!, field: String): String
  }

  extend type Mutation {
    upsertNotice(data: [NoticeInput!]!): Boolean
    noticeToProgress(nids: [Int!]!): UpdateResult!
    updateNoticeCategory(nids: [Int!]!, category: String!): UpdateResult!
    excludeNotices(nids: [Int!]!): UpdateResult!
    restoreNotices(nids: [Int!]!): UpdateResult!
  }

  input NoticeInput {
    nid: Int
    title: String
    orgName: String
    region: String
    detailUrl: String
    category: String
    registration: String
    postedAt: String
  }

  type UpdateResult {
    success: Boolean!
    message: String
  }
`;
