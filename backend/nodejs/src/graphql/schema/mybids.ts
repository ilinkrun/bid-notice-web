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
    detailUrl: String
    category: String
    region: String
  }

  type NoticeFile {
    file_name: String!
    file_url: String!
    down_folder: String
    source: String!
    order: Int!
  }

  type NoticeFilesResponse {
    success: Boolean!
    nid: Int!
    files: [NoticeFile!]!
    total_count: Int!
  }

  type NoticeDetails {
    title: String
    notice_num: String
    org_dept: String
    org_tel: String
    body_html: String
    detail_url: String
    category: String
  }

  type NoticeDetailsResponse {
    success: Boolean!
    nid: Int!
    details: NoticeDetails!
    message: String
  }

  input NoticeDetailsInput {
    title: String
    notice_num: String
    org_dept: String
    org_tel: String
    body_html: String
    detail_url: String
    category: String
  }

  type NoticeDetailsUpdateResult {
    success: Boolean!
    message: String!
    nid: Int
  }

  extend type Query {
    mybidsAll: [MyBid!]!
    mybidsByStatus(status: String!): [MyBid!]!
    mybidsOne(nid: Int!): MyBid
    noticeFiles(nid: Int!): NoticeFilesResponse
    noticeDetails(nid: Int!): NoticeDetailsResponse
  }

  extend type Mutation {
    mybidCreate(input: MyBidInput!): MyBid
    mybidUpdate(input: MyBidUpdateInput!): UpdateResult
    mybidUpsert(input: MyBidInput!): MyBid
    mybidDelete(mid: Int!): Boolean
    noticeDetailsUpdate(nid: Int!, input: NoticeDetailsInput!): NoticeDetailsUpdateResult
  }

  type UpdateResult {
    success: Boolean!
    message: String!
    nid: Int
    status: String
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
    detailUrl: String
    category: String
    region: String
  }

  input MyBidUpdateInput {
    nid: Int!
    status: String!
    memo: String
    detail: String
  }
`;