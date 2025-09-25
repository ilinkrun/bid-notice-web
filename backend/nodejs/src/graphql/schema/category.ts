export const categoryTypeDefs = `#graphql
  type NoticeCategory {
    sn: Int!
    category: String!
    keywords: String!
    nots: String!
    minPoint: Int!
    creator: String
    use: Int!
  }

  extend type Query {
    noticeCategoriesAll: [NoticeCategory!]!
    noticeCategoriesActive: [NoticeCategory!]!
  }
`;