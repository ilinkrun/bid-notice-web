import { gql } from 'graphql-tag';
export const spidersTypeDefs = gql `
  type SpiderFetchResult {
    orgName: String!
    success: Boolean!
    errorCode: Int!
    errorMessage: String
    dataCount: Int!
    data: [JSONObject]
  }

  type SpiderHelloResult {
    message: String!
  }

  extend type Query {
    spidersCheckFetchList(orgName: String!): SpiderFetchResult
    spidersHello: SpiderHelloResult
  }

  extend type Mutation {
    spidersTestCsv(csvData: String!): JSONObject
  }

  scalar JSONObject
`;
//# sourceMappingURL=spiders.js.map