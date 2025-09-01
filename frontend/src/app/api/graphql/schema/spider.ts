import { gql } from 'graphql-tag';

export const spiderTypeDefs = gql`
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

  type Query {
    checkFetchList(orgName: String!): SpiderFetchResult
    spiderHello: SpiderHelloResult
  }

  type Mutation {
    testCsv(csvData: String!): JSONObject
  }

  scalar JSONObject
`;