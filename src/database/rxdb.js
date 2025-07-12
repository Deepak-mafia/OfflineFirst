import { createRxDatabase, addRxPlugin } from 'rxdb';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';
import {
  getRxStorageSQLiteTrial,
  getSQLiteBasicsQuickSQLite,
} from 'rxdb/plugins/storage-sqlite';
import { sha256 } from 'js-sha256'; // pure JS SHA-256
import { open } from 'react-native-quick-sqlite';

// Add necessary plugins
addRxPlugin(RxDBDevModePlugin);
addRxPlugin(RxDBQueryBuilderPlugin);

const sqlite = getRxStorageSQLiteTrial({
  sqliteBasics: getSQLiteBasicsQuickSQLite(open),
});
const storage = wrappedValidateAjvStorage({ storage: sqlite });

const businessSchema = {
  title: 'business schema',
  version: 0,
  description: 'describes a business',
  type: 'object',
  primaryKey: 'id',
  properties: {
    id: { type: 'string', maxLength: 100 },
    name: { type: 'string' },
  },
  required: ['id', 'name'],
};

const articleSchema = {
  title: 'article schema',
  version: 0,
  description: 'describes an article',
  type: 'object',
  primaryKey: 'id',
  properties: {
    id: { type: 'string', maxLength: 100 },
    name: { type: 'string' },
    qty: { type: 'number' },
    selling_price: { type: 'number' },
    business_id: { type: 'string' },
  },
  required: ['id', 'name', 'qty', 'selling_price', 'business_id'],
};

let dbPromise = null;
export const getDB = () => {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await createRxDatabase({
        name: 'offlinefirstdb',
        storage,
        multiInstance: false,
        ignoreDuplicate: true,
        hashFunction: input => Promise.resolve(sha256(input)),
      });
      await db.addCollections({
        businesses: { schema: businessSchema },
        articles: { schema: articleSchema },
      });
      return db;
    })();
  }
  return dbPromise;
};
