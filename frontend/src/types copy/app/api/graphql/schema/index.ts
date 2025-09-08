import { gql } from 'graphql-tag';
import { noticeTypeDefs } from './notice';
import { settingsListTypeDefs } from './settingsList';
import { settingsCategoryTypeDefs } from './settingsCategory';
import { settingsDetailTypeDefs } from './settingsDetail';
import { settingsDefaultTypeDefs } from './settingsDefault';
import { logScrapingTypeDefs } from './logScraping';
import { errorScrapingTypeDefs } from './errorScraping';
import { boardTypeDefs } from './board';
import { bidTypeDefs } from './myBid';
import { spiderTypeDefs } from './spider';
import { mysqlTypeDefs } from './mysql';

const baseTypeDefs = gql`
  type Query {
    health: String
  }

  type Mutation {
    _empty: String
  }
`;

export const typeDefs = [
  baseTypeDefs,
  noticeTypeDefs,
  settingsListTypeDefs,
  settingsCategoryTypeDefs,
  settingsDetailTypeDefs,
  settingsDefaultTypeDefs,
  logScrapingTypeDefs,
  errorScrapingTypeDefs,
  boardTypeDefs,
  bidTypeDefs,
  spiderTypeDefs,
  mysqlTypeDefs,
];
