export const settingsDefaultTypeDefs = `#graphql
  type NasPathSetting {
    id: Int!
    name: String!
    area: String!
    depth: Int!
    folder: String!
    remark: String
  }

  type NasInfo {
    type: String!
    model: String
    version: String
    status: String
  }

  type UiSettings {
    darkMode: Boolean!
    language: String!
    timezone: String!
  }

  type ThemeSettings {
    defaultTheme: String!
    noticeTheme: String!
    bidTheme: String!
  }

  type ScrapingSettings {
    schedule: [String]!
    isActive: Boolean!
    lastRun: String
    nextRun: String
  }

  type SettingsDefault {
    nasPathSettings: [NasPathSetting]!
    nasInfo: NasInfo
    uiSettings: UiSettings!
    themeSettings: ThemeSettings!
    scrapingSettings: ScrapingSettings!
  }

  type Query {
    settingsDefault: SettingsDefault
    nasPathSettings: [NasPathSetting]!
  }

  type Mutation {
    updateUiSettings(darkMode: Boolean, language: String, timezone: String): UiSettings
    updateThemeSettings(defaultTheme: String, noticeTheme: String, bidTheme: String): ThemeSettings
    updateScrapingSettings(schedule: [String], isActive: Boolean): ScrapingSettings
    updateNasPathSetting(id: Int!, name: String, area: String, depth: Int, folder: String, remark: String): NasPathSetting
    addNasPathSetting(name: String!, area: String!, depth: Int!, folder: String!, remark: String): NasPathSetting
    deleteNasPathSetting(id: Int!): Boolean
  }
`;