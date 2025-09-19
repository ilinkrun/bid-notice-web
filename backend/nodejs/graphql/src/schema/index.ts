import { gql } from 'graphql-tag';
import { noticesTypeDefs } from './notices.js';
import { settingsTypeDefs } from './settings.js';
import { logsTypeDefs } from './logs.js';
import { mybidsTypeDefs } from './mybids.js';
import { boardsTypeDefs } from './boards.js';
import { docsTypeDefs } from './docs.js';
import { spidersTypeDefs } from './spiders.js';
import { databaseTypeDefs } from './database.js';
import { authTypeDefs } from './auth.js';
import { permissionsTypeDefs } from './permissions.js';

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
  noticesTypeDefs,
  settingsTypeDefs,
  logsTypeDefs,
  mybidsTypeDefs,
  boardsTypeDefs,
  docsTypeDefs,
  spidersTypeDefs,
  databaseTypeDefs,
  authTypeDefs,
  permissionsTypeDefs,
];
