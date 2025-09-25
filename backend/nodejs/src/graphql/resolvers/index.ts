import { baseResolvers } from './base.js';
import { noticesResolvers } from './notices.js';
import { noticesNaraResolvers } from './noticesNara.js';
import { settingsResolvers } from './settings.js';
import { logsResolvers } from './logs.js';
import { mybidsResolvers } from './mybids.js';
import { boardsResolvers } from './boards.js';
import { docsResolvers } from './docs.js';
import { spidersResolvers } from './spiders.js';
import { databaseResolvers } from './database.js';
import { authResolvers } from './auth.js';
import { permissionsResolvers } from './permissions.js';
import { mappingsResolvers } from './mappings.js';
import { categoryResolvers } from './category.js';

export const resolvers = [
  baseResolvers,
  noticesResolvers,
  noticesNaraResolvers,
  settingsResolvers,
  logsResolvers,
  mybidsResolvers,
  boardsResolvers,
  docsResolvers,
  spidersResolvers,
  databaseResolvers,
  authResolvers,
  permissionsResolvers,
  mappingsResolvers,
  categoryResolvers,
];
