export const categoryTypeDefs = `#graphql
  type NoticeCategory {
    sn: Int!
    category: String!
    division: String
    keywords: String!
    nots: String!
    minPoint: Int!
    creator: String
    isActive: Int!
  }

  extend type Query {
    noticeCategoriesAll: [NoticeCategory!]!
    noticeCategoriesActive: [NoticeCategory!]!
  }
`;