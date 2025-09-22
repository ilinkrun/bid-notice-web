export const docsTypeDefs = `#graphql
  type DocsManual {
    id: Int!
    email: String
    title: String!
    content: String!
    markdown_source: String
    format: String!
    category: String!
    file_path: String
    writer: String!
    created_at: String
    updated_at: String
    is_visible: Boolean
    is_notice: Boolean
    is_private: Boolean
    scope: String
    parent_scope_id: Int
    scope_hierarchy: String
  }

  type DocsManualResponse {
    manuals: [DocsManual!]!
    total_count: Int!
    page: Int!
    limit: Int!
  }

  type DocsManualSearchResponse {
    manuals: [DocsManual!]!
    total_count: Int!
    page: Int!
    limit: Int!
    query: String!
  }

  type DocsCategoriesResponse {
    categories: [String!]!
  }

  input DocsManualInput {
    id: Int
    email: String
    title: String!
    content: String!
    markdown_source: String
    format: String!
    category: String!
    file_path: String
    writer: String!
    is_visible: Boolean
    is_notice: Boolean
    is_private: Boolean
    scope: String
    parent_scope_id: Int
    scope_hierarchy: String
  }

  input DocsManualDeleteInput {
    id: Int!
  }

  extend type Query {
    docsManualAll(
      category: String
      limit: Int = 100
      offset: Int = 0
    ): DocsManualResponse

    docsManualOne(id: Int!): DocsManual

    docsManualSearch(
      query: String!
      category: String
      limit: Int = 100
      offset: Int = 0
    ): DocsManualSearchResponse

    docsManualSearchByScope(
      scope: String!
      scope_hierarchy: String!
      limit: Int = 100
      offset: Int = 0
    ): DocsManualSearchResponse

    docsCategories: DocsCategoriesResponse
  }

  extend type Mutation {
    docsManualCreate(input: DocsManualInput!): DocsManual
    docsManualUpdate(input: DocsManualInput!): DocsManual
    docsManualDelete(input: DocsManualDeleteInput!): DocsManual
  }
`;