export const settingsListTypeDefs = `#graphql
  type Element {
    key: String!
    xpath: String!
    target: String
    callback: String
  }

  type SettingsList {
    orgName: String!
    detailUrl: String!
    iframe: String
    rowXpath: String!
    paging: String!
    startPage: Int!
    endPage: Int!
    login: String
    elements: [Element!]!
    region: String
    registration: Int
    use: Int!
  }

  type SettingsListBrief {
    orgName: String!
    detailUrl: String!
    region: String
    registration: Int
    use: Int!
  }

  input ElementInput {
    key: String!
    xpath: String!
    target: String
    callback: String
  }

  input SettingsListInput {
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
  }

  extend type Query {
    settingsLists: [SettingsListBrief!]!
    settingList(orgName: String!): SettingsList
    orgNameList: [String!]!
  }

  extend type Mutation {
    createSettingsList(input: SettingsListInput!): SettingsList!
    updateSettingsList(orgName: String!, input: SettingsListInput!): SettingsList!
    # deleteSettingsList(orgName: String!): Boolean!
  }
`; 