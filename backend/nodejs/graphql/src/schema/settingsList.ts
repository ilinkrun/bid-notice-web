export const settingsListTypeDefs = `#graphql
  type Element {
    key: String!
    xpath: String!
    target: String
    callback: String
  }

  type SettingsList {
    oid: Int
    orgName: String
    detailUrl: String
    iframe: String
    rowXpath: String
    paging: String
    startPage: Int
    endPage: Int
    login: String
    elements: [Element]
    region: String
    registration: Int
    use: Int
    companyInCharge: String
    orgMan: String
    exceptionRow: String
  }

  type SettingsListBrief {
    oid: Int!
    orgName: String!
    detailUrl: String!
    region: String
    registration: Int
    use: Int!
    companyInCharge: String
  }

  input ElementInput {
    key: String!
    xpath: String!
    target: String
    callback: String
  }

  input SettingsListInput {
    oid: Int
    orgName: String!
    detailUrl: String!
    iframe: String
    rowXpath: String!
    paging: String!
    startPage: Int!
    endPage: Int!
    login: String
    elements: [ElementInput!]!
    region: String
    registration: Int
    use: Int!
    companyInCharge: String
    orgMan: String
    exceptionRow: String
  }

  type SettingsDetail {
    oid: Int
    orgName: String
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
    use: Int
    sampleUrl: String
    down: Int
  }

  input SettingsDetailInput {
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
    use: Int!
    sampleUrl: String
    down: Int
  }

  extend type Query {
    settingsLists: [SettingsListBrief]
    settingList(orgName: String): SettingsList
    settingListByOid(oid: Int): SettingsList
    settingsDetailByOid(oid: Int): SettingsDetail
    orgNameList: [String]
  }

  extend type Mutation {
    createSettingsList(input: SettingsListInput!): SettingsList!
    updateSettingsList(orgName: String!, input: SettingsListInput!): SettingsList!
    upsertSettingsList(orgName: String!, input: SettingsListInput!): SettingsList!
    upsertSettingsListByOid(oid: Int!, input: SettingsListInput!): SettingsList!
    upsertSettingsDetailByOid(oid: Int!, input: SettingsDetailInput!): SettingsDetail!
    # deleteSettingsList(orgName: String!): Boolean!
  }
`; 