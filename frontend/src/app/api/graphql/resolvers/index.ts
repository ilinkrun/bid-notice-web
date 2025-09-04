import { baseResolvers } from './base';
import { noticeResolvers } from './notice';
import { settingsListResolvers } from './settingsList';
import { settingsDetailResolvers } from './settingsDetail';
import { settingsDefaultResolvers } from './settingsDefault';
import { settingsCategoryResolvers } from './settingsCategory';
import { logScrapingResolvers } from './logScraping';
import { errorScrapingResolvers } from './errorScraping';
import { boardResolvers } from './board';
import { bidResolvers } from './myBid';
import { spiderResolvers } from './spider';
import { mysqlResolvers } from './mysql';

export const resolvers = [
  baseResolvers,
  noticeResolvers,
  settingsListResolvers,
  settingsDetailResolvers,
  settingsDefaultResolvers,
  settingsCategoryResolvers,
  logScrapingResolvers,
  errorScrapingResolvers,
  boardResolvers,
  bidResolvers,
  spiderResolvers,
  mysqlResolvers,
];
