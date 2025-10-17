export const settingsTypeDefs = `#graphql

  type SettingsElement {
    key: String!
    xpath: String!
    target: String
    callback: String
  }

  type SettingsNoticeList {
    oid: Int!
    orgName: String!
    url: String!
    iframe: String
    rowXpath: String
    paging: String
    startPage: Int
    endPage: Int
    login: String
    isActive: Int!
    orgRegion: String
    registration: String
    title: String
    detailUrl: String
    postedDate: String
    postedBy: String
    companyInCharge: String
    orgMan: String
    exceptionRow: String
    elements: [SettingsElement]
  }

  type SettingsNoticeDetail {
    oid: Int!
    orgName: String!
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
    isActive: Int!
    sampleUrl: String
    down: String
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

  type AppSetting {
    sn: Int!
    area: String!
    name: String!
    value: String!
    remark: String
    created_at: String
    updated_at: String
  }

  extend type Query {
    settingsNoticeListAll: [SettingsNoticeList!]!
    settingsNoticeListOne(oid: Int!): SettingsNoticeList
    settingListByOid(oid: Int): SettingsNoticeList
    settingsNoticeListByOrg(orgName: String!): [SettingsNoticeList!]!
    
    settingsNoticeDetailAll: [SettingsNoticeDetail!]!
    settingsNoticeDetailOne(oid: Int!): SettingsNoticeDetail
    settingsDetailByOid(oid: Int!): SettingsNoticeDetail
    settingsNoticeDetailByOrg(orgName: String!): [SettingsNoticeDetail!]!
    
    settingsNoticeCategoryAll: [SettingsNoticeCategory!]!
    settingsNoticeCategoryByCategory(category: String!): [SettingsNoticeCategory!]!
    settingsNoticeCategoryParseKeywordWeights(keywordWeightStr: String!): [String]
    
    settingsNasPathAll: [SettingsNasPath!]!
    settingsNasPathOne(id: String!): SettingsNasPath
    
    appSettingsAll: [AppSetting!]!
    appSettingsByArea(area: String!): [AppSetting!]!
    appSettingByName(area: String!, name: String!): AppSetting
    appSettingValue(area: String!, name: String!): String
  }

  extend type Mutation {
    settingsNoticeListCreate(input: SettingsNoticeListInput!): SettingsNoticeList!
    settingsNoticeListUpdate(input: SettingsNoticeListInput!): SettingsNoticeList!
    settingsNoticeListDelete(oid: Int!): Boolean
    
    settingsNoticeDetailCreate(input: SettingsNoticeDetailInput!): SettingsNoticeDetail!
    settingsNoticeDetailUpdate(input: SettingsNoticeDetailInput!): SettingsNoticeDetail!
    settingsNoticeDetailDelete(oid: Int!): Boolean
    upsertSettingsDetailByOid(oid: Int!, input: SettingsNoticeDetailInput!): SettingsNoticeDetail!
    
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
    
    appSettingCreate(input: AppSettingInput!): AppSetting!
    appSettingUpdate(input: AppSettingInput!): AppSetting!
    appSettingDelete(sn: Int!): Boolean
  }

  input SettingsNoticeListInput {
    oid: Int
    orgName: String!
    url: String!
    iframe: String
    rowXpath: String
    paging: String
    startPage: Int
    endPage: Int
    login: String
    isActive: Int
    orgRegion: String
    registration: String
    title: String
    detailUrl: String
    postedDate: String
    postedBy: String
    companyInCharge: String
    orgMan: String
    exceptionRow: String
  }

  input SettingsNoticeDetailInput {
    oid: Int
    orgName: String!
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
    isActive: Int
    sampleUrl: String
    down: String
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

  input AppSettingInput {
    sn: Int
    area: String!
    name: String!
    value: String!
    remark: String
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