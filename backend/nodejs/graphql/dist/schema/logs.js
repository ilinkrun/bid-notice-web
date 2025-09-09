export const logsTypeDefs = `#graphql
  type LogScraping {
    orgName: String!
    errorCode: String
    errorMessage: String
    scrapedCount: Int
    insertedCount: Int
    time: String!
  }

  type ErrorScraping {
    id: String!
    orgName: String!
    errorMessage: String!
    time: String!
  }

  extend type Query {
    logsScrapingAll(gap: Int): [LogScraping!]!
    logsErrorAll(gap: Int): [ErrorScraping!]!
  }

  extend type Mutation {
    logCreate(input: LogScrapingInput!): LogScraping!
    logUpdate(id: String!, input: LogScrapingInput!): LogScraping!
  }

  input LogScrapingInput {
    orgName: String
    errorCode: String
    errorMessage: String
    scrapedCount: Int
    insertedCount: Int
    time: String
  }
`;
//# sourceMappingURL=logs.js.map