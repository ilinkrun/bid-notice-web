import { gql } from 'graphql-tag';
export const permissionsTypeDefs = gql `
  type Permission {
    id: ID!
    role: String!
    name: String!
    description: String!
    allowedPages: [String!]!
    deniedPages: [String!]!
    permissions: PermissionDetails!
  }

  type PermissionDetails {
    canView: [String!]!
    canEdit: [String!]!
    canDelete: [String!]!
    canAdmin: [String!]!
  }

  type PageAccessResult {
    hasAccess: Boolean!
    role: String!
    message: String!
    redirectTo: String
  }

  extend type Query {
    permissions: [Permission!]!
    permissionByRole(role: String!): Permission
    checkPageAccess(path: String!, token: String): PageAccessResult!
    getUserPermissions(token: String): Permission
  }

  extend type Mutation {
    updateRolePermissions(role: String!, input: PermissionInput!): Permission!
  }

  input PermissionInput {
    allowedPages: [String!]!
    deniedPages: [String!]!
    permissions: PermissionDetailsInput!
  }

  input PermissionDetailsInput {
    canView: [String!]!
    canEdit: [String!]!
    canDelete: [String!]!
    canAdmin: [String!]!
  }
`;
//# sourceMappingURL=permissions.js.map