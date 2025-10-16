export const collectorsTypeDefs = `#graphql

  type CollectListResult {
    success: Boolean!
    totalScraped: Int!
    totalInserted: Int!
    agencies: Int!
    errors: [String!]!
  }

  type DetailScrapingData {
    title: String
    bodyHtml: String
    fileName: String
    fileUrl: String
    noticeDiv: String
    noticeNum: String
    orgDept: String
    orgMan: String
    orgTel: String
    detailUrl: String
    orgName: String
  }

  type CollectDetailResult {
    success: Boolean!
    processed: Int!
    updated: Int!
    errors: [String!]!
    data: DetailScrapingData
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
    sampleUrl: String
    title: String
    bodyHtml: String
    fileName: String
    fileUrl: String
    preview: String
    noticeDiv: String
    noticeNum: String
    orgDept: String
    orgMan: String
    orgTel: String
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