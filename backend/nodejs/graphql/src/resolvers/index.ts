import { baseResolvers } from './base.js';
import { noticesResolvers } from './notices.js';
import { settingsResolvers } from './settings.js';
import { logsResolvers } from './logs.js';
import { mybidsResolvers } from './mybids.js';
import { boardsResolvers } from './boards.js';
import { spidersResolvers } from './spiders.js';
import { databaseResolvers } from './database.js';
import { authResolvers } from './auth.js';
import { permissionsResolvers } from './permissions.js';

export const resolvers = [
  baseResolvers,
  noticesResolvers,
  settingsResolvers,
  logsResolvers,
  mybidsResolvers,
  boardsResolvers,
  spidersResolvers,
  databaseResolvers,
  authResolvers,
  permissionsResolvers,
];
