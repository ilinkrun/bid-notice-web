import { gql } from 'graphql-tag';

export const databaseTypeDefs = gql`
  extend type Query {
    databaseExecuteSql(sql: String!): [JSONObject]
  }

  extend type Mutation {
    databaseSearchNoticesByWeight(
      keywords: String!
      nots: String!
      minPoint: Float!
      addWhere: String
      baseSql: String
      addSql: String
    ): [Notice]
  }

  scalar JSONObject
`;