export const settingsDetailTypeDefs = `#graphql
  type Element {
    key: String!
    xpath: String!
    target: String
    callback: String
  }

  # type SettingsDetailBrief {
  #   orgName: String
  #   title: String
  #   content: String
  #   fileName: String
  #   fileUrl: String
  #   noticeType: String
  #   noticeNumber: String
  #   department: String
  #   manager: String
  #   contact: String
  # }

  type SettingsDetailBrief {
    orgName: String
    title: String
    content: String
  }

  type SettingsDetail {
    orgName: String
    elements: [Element]
  }

  type Query {
    settingsDetails: [SettingsDetailBrief]
    settingDetail(orgName: String!): SettingsDetail
  }
`;
