export const noticesTypeDefs = `#graphql
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

  type NoticeDetail {
    nid: Int!
    title: String
    fileName: String
    fileUrl: String
    noticeDiv: String
    noticeNum: String
    orgDept: String
    orgMan: String
    orgTel: String
    scrapedAt: String!
    updatedAt: String!
    orgName: String
    bodyHtml: String
    detailUrl: String
    createdAt: String
    postedDate: String
    postedBy: String
    category: String
  }

  extend type Query {
    noticesByCategory(category: String!, gap: Int): [Notice!]!
    noticesByCategories(categories: [String!]!, gap: Int): [Notice!]!
    notices(category: String, gap: Int): [Notice!]!
    noticesStatistics(gap: Int): [NoticeStatistics]!
    noticesRegionStatistics(gap: Int): [NoticeRegionStatistics]!
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