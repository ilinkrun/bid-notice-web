export const collectorsTypeDefs = `#graphql

  type CollectListResult {
    success: Boolean!
    totalScraped: Int!
    totalInserted: Int!
    agencies: Int!
    errors: [String!]!
  }

  type CollectDetailResult {
    success: Boolean!
    processed: Int!
    updated: Int!
    errors: [String!]!
  }

  type ScrapingResult {
    orgName: String!
    errorCode: Int!
    errorMessage: String!
    data: [Notice!]!
  }

  input CollectListInput {
    agencies: [String!]
    limit: Int
    dryRun: Boolean
    debug: Boolean
  }

  input CollectDetailInput {
    orgName: String
    noticeId: String
    limit: Int
    dryRun: Boolean
    debug: Boolean
  }

  extend type Query {
    # Test queries for debugging
    testCollectList(input: CollectListInput!): CollectListResult!
    testCollectDetail(input: CollectDetailInput!): CollectDetailResult!
  }

  extend type Mutation {
    # Main collection mutations
    collectList(input: CollectListInput!): CollectListResult!
    collectDetail(input: CollectDetailInput!): CollectDetailResult!

    # Advanced collection with custom settings
    collectListWithSettings(settings: SettingsNoticeListInput!): ScrapingResult!
    collectDetailWithSettings(settings: SettingsNoticeDetailInput!): [NoticeDetail!]!
  }
`;