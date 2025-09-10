import { baseResolvers } from './base';
import { noticesResolvers } from './notices';
import { settingsResolvers } from './settings';
import { logsResolvers } from './logs';
import { mybidsResolvers } from './mybids';
import { boardsResolvers } from './boards';
import { spidersResolvers } from './spiders';
import { databaseResolvers } from './database';
import { authResolvers } from './auth';
import { permissionsResolvers } from './permissions';
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
//# sourceMappingURL=index.js.map