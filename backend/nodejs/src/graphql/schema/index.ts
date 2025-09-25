import { gql } from 'graphql-tag';
import { noticesTypeDefs } from './notices.js';
import { noticesNaraTypeDefs } from './noticesNara.js';
import { settingsTypeDefs } from './settings.js';
import { logsTypeDefs } from './logs.js';
import { mybidsTypeDefs } from './mybids.js';
import { boardsTypeDefs } from './boards.js';
import { docsTypeDefs } from './docs.js';
import { spidersTypeDefs } from './spiders.js';
import { databaseTypeDefs } from './database.js';
import { authTypeDefs } from './auth.js';
import { permissionsTypeDefs } from './permissions.js';
import { mappingsTypeDefs } from './mappings.js';
import { categoryTypeDefs } from './category.js';

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
  noticesNaraTypeDefs,
  settingsTypeDefs,
  logsTypeDefs,
  mybidsTypeDefs,
  boardsTypeDefs,
  docsTypeDefs,
  spidersTypeDefs,
  databaseTypeDefs,
  authTypeDefs,
  permissionsTypeDefs,
  mappingsTypeDefs,
  categoryTypeDefs,
];
