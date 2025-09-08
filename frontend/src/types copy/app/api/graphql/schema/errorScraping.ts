export const errorScrapingTypeDefs = `#graphql
  type ErrorScraping {
    orgNames: [String]!
    time: String
  }

  extend type Query {
    errorScrapings(gap: Int!): [ErrorScraping!]!
  }
`;
