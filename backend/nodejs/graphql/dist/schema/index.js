import { gql } from 'graphql-tag';
import { noticesTypeDefs } from './notices';
import { settingsTypeDefs } from './settings';
import { logsTypeDefs } from './logs';
import { mybidsTypeDefs } from './mybids';
import { boardsTypeDefs } from './boards';
import { spidersTypeDefs } from './spiders';
import { databaseTypeDefs } from './database';
const baseTypeDefs = gql `
  type Query {
    health: String
  }

  type Mutation {
    _empty: String
  }
`;
export const typeDefs = [
    baseTypeDefs,
    noticesTypeDefs,
    settingsTypeDefs,
    logsTypeDefs,
    mybidsTypeDefs,
    boardsTypeDefs,
    spidersTypeDefs,
    databaseTypeDefs,
];
//# sourceMappingURL=index.js.map