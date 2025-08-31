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
  }

  extend type Mutation {
    createSettingsCategory(input: CreateSettingsCategoryInput!): SettingsCategory!
    updateSettingsCategory(input: UpdateSettingsCategoryInput!): SettingsCategory!
  }
`; 