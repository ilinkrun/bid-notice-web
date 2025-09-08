import { gql } from 'graphql-tag';

export const mysqlTypeDefs = gql`
  type Query {
    executeSql(sql: String!): [JSONObject]
  }

  type Mutation {
    searchNoticesByWeight(
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