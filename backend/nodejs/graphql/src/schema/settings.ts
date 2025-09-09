export const settingsTypeDefs = `#graphql
  type SettingsNoticeList {
    id: String!
    orgName: String!
    crawlUrl: String!
    crawlUrlDetail: String
    isActive: Boolean!
    lastCrawledAt: String
    memo: String
  }

  type SettingsNoticeDetail {
    id: String!
    orgName: String!
    detailUrl: String!
    selector: String
    isActive: Boolean!
    memo: String
  }

  type SettingsNoticeCategory {
    sn: Int!
    keywords: String!
    nots: String!
    minPoint: Float!
    category: String!
    creator: String
    memo: String
  }

  type SettingsNasPath {
    id: String!
    pathName: String!
    pathValue: String!
    description: String
    isActive: Boolean!
  }

  type SettingsAppDefault {
    id: String!
    settingKey: String!
    settingValue: String!
    description: String
    category: String
  }

  extend type Query {
    settingsNoticeListAll: [SettingsNoticeList!]!
    settingsNoticeListOne(orgName: String!): SettingsNoticeList
    settingsNoticeListByOrg(orgName: String!): [SettingsNoticeList!]!
    
    settingsNoticeDetailAll: [SettingsNoticeDetail!]!
    settingsNoticeDetailOne(orgName: String!): SettingsNoticeDetail
    settingsNoticeDetailByOrg(orgName: String!): [SettingsNoticeDetail!]!
    
    settingsNoticeCategoryAll: [SettingsNoticeCategory!]!
    settingsNoticeCategoryByCategory(category: String!): [SettingsNoticeCategory!]!
    settingsNoticeCategoryParseKeywordWeights(keywordWeightStr: String!): [String]
    
    settingsNasPathAll: [SettingsNasPath!]!
    settingsNasPathOne(id: String!): SettingsNasPath
    
    settingsAppDefaultAll: [SettingsAppDefault!]!
    settingsAppDefaultByCategory(category: String!): [SettingsAppDefault!]!
    settingsAppDefaultOne(settingKey: String!): SettingsAppDefault
  }

  extend type Mutation {
    settingsNoticeListCreate(input: SettingsNoticeListInput!): SettingsNoticeList!
    settingsNoticeListUpdate(input: SettingsNoticeListInput!): SettingsNoticeList!
    settingsNoticeListDelete(id: String!): Boolean
    
    settingsNoticeDetailCreate(input: SettingsNoticeDetailInput!): SettingsNoticeDetail!
    settingsNoticeDetailUpdate(input: SettingsNoticeDetailInput!): SettingsNoticeDetail!
    settingsNoticeDetailDelete(id: String!): Boolean
    
    settingsNoticeCategoryCreate(input: SettingsNoticeCategoryInput!): SettingsNoticeCategory!
    settingsNoticeCategoryUpdate(input: SettingsNoticeCategoryInput!): SettingsNoticeCategory!
    settingsNoticeCategoryDelete(sn: Int!): Boolean
    settingsNoticeCategoryWeightSearch(
      keywords: String!
      minPoint: Float!
      field: String
      tableName: String
      addFields: [String]
      addWhere: String
    ): [Notice]
    settingsNoticeCategoryFilterNoticeList(
      notStr: String!
      dicts: [CategorySearchInput]!
      field: String
    ): [Notice]
    
    settingsNasPathCreate(input: SettingsNasPathInput!): SettingsNasPath!
    settingsNasPathUpdate(input: SettingsNasPathInput!): SettingsNasPath!
    settingsNasPathDelete(id: String!): Boolean
    
    settingsAppDefaultCreate(input: SettingsAppDefaultInput!): SettingsAppDefault!
    settingsAppDefaultUpdate(input: SettingsAppDefaultInput!): SettingsAppDefault!
    settingsAppDefaultDelete(id: String!): Boolean
  }

  input SettingsNoticeListInput {
    id: String
    orgName: String!
    crawlUrl: String!
    crawlUrlDetail: String
    isActive: Boolean
    lastCrawledAt: String
    memo: String
  }

  input SettingsNoticeDetailInput {
    id: String
    orgName: String!
    detailUrl: String!
    selector: String
    isActive: Boolean
    memo: String
  }

  input SettingsNoticeCategoryInput {
    sn: Int
    keywords: String!
    nots: String!
    minPoint: Float!
    category: String!
    creator: String
    memo: String
  }

  input SettingsNasPathInput {
    id: String
    pathName: String!
    pathValue: String!
    description: String
    isActive: Boolean
  }

  input SettingsAppDefaultInput {
    id: String
    settingKey: String!
    settingValue: String!
    description: String
    category: String
  }

  input CategorySearchInput {
    nid: Int
    title: String
    orgName: String
    postedAt: String
    detailUrl: String
    category: String
    region: String
  }
`;