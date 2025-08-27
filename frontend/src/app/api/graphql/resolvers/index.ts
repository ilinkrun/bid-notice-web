import { baseResolvers } from './base';
import { noticeResolvers } from './notice';
import { settingsListResolvers } from './settingsList';
import { settingsDetailResolvers } from './settingsDetail';
import { settingsCategoryResolvers } from './settingsCategory';
import { logScrapingResolvers } from './logScraping';
import { errorScrapingResolvers } from './errorScraping';
import { boardResolvers } from './board';
import { bidResolvers } from './bid';

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
];
