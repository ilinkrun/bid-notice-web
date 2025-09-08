export const logScrapingTypeDefs = `#graphql
  type LogScraping {
    orgName: String
    errorCode: String
    errorMessage: String
    scrapedCount: Int
    insertedCount: Int
    time: String
  }

  extend type Query {
    logScrapings(gap: Int!): [LogScraping!]!
  }

  input CreateLogScrapingInput {
    category: String!
    status: String!
    message: String!
  }

  type CreateLogScrapingPayload {
    id: String!
    category: String!
    status: String!
    message: String!
    createdAt: String!
  }

  extend type Mutation {
    createLogScraping(input: CreateLogScrapingInput!): CreateLogScrapingPayload!
  }
`;
