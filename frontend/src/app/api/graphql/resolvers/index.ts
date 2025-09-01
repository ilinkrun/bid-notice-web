import { baseResolvers } from './base';
import { noticeResolvers } from './notice';
import { settingsListResolvers } from './settingsList';
import { settingsDetailResolvers } from './settingsDetail';
import { settingsCategoryResolvers } from './settingsCategory';
import { logScrapingResolvers } from './logScraping';
import { errorScrapingResolvers } from './errorScraping';
import { boardResolvers } from './board';
import { bidResolvers } from './bid';
import { spiderResolvers } from './spider';
import { mysqlResolvers } from './mysql';

export const resolvers = [
  baseResolvers,
  noticeResolvers,
  settingsListResolvers,
  settingsDetailResolvers,
  settingsCategoryResolvers,
  logScrapingResolvers,
  errorScrapingResolvers,
  boardResolvers,
  bidResolvers,
  spiderResolvers,
  mysqlResolvers,
];
