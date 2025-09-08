export const settingsCategoryTypeDefs = `#graphql
  type SettingsCategory {
    sn: Int!
    keywords: String!
    nots: String!
    minPoint: Int!
    category: String!
    creator: String
    memo: String
  }

  input CreateSettingsCategoryInput {
    sn: Int
    keywords: String!
    nots: String!
    minPoint: Int!
    category: String!
    creator: String
    memo: String
  }

  input UpdateSettingsCategoryInput {
    sn: Int!
    keywords: String!
    nots: String!
    minPoint: Int!
    category: String!
    creator: String
    memo: String
  }

  extend type Query {
    settingsCategorys: [SettingsCategory!]!
    settingsCategoryByCategory(category: String!): [SettingsCategory!]!
    parseKeywordWeights(keywordWeightStr: String!): [JSONObject]
  }

  extend type Mutation {
    createSettingsCategory(input: CreateSettingsCategoryInput!): SettingsCategory!
    updateSettingsCategory(input: UpdateSettingsCategoryInput!): SettingsCategory!
    categoryWeightSearch(
      keywords: String!
      minPoint: Float!
      field: String
      tableName: String
      addFields: [String]
      addWhere: String
    ): [Notice]
    filterNoticeList(
      notStr: String!
      dicts: [JSONObject]!
      field: String
    ): [Notice]
  }

  scalar JSONObject
`; 