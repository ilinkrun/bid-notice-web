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

  extend type Query {
    noticesAll(gap: Int): [Notice!]!
    noticesByCategory(category: String!, gap: Int): [Notice!]!
    noticesStatistics(gap: Int): [NoticeStatistics]!
    noticesRegionStatistics(gap: Int): [NoticeRegionStatistics]!
    noticesSearch(
      keywords: String!
      nots: String!
      minPoint: Float!
      addWhere: String
    ): [Notice]
    noticesOne(orgName: String!, field: String): String
  }

  extend type Mutation {
    noticesUpsert(data: [NoticeInput!]!): Boolean
    noticesUpdateToProgress(nids: [Int!]!): UpdateResult!
    noticesUpdateCategory(nids: [Int!]!, category: String!): UpdateResult!
    noticesExclude(nids: [Int!]!): UpdateResult!
    noticesRestore(nids: [Int!]!): UpdateResult!
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