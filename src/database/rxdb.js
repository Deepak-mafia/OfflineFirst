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
import { COUCHDB_CONFIG } from '../utils/couchdbConfig';

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

// CouchDB Replication Configuration
const COUCHDB_URL = COUCHDB_CONFIG.url;
const COUCHDB_DB_NAME = COUCHDB_CONFIG.database;
const COUCHDB_USERNAME = COUCHDB_CONFIG.username;
const COUCHDB_PASSWORD = COUCHDB_CONFIG.password;

// Simple CouchDB sync functions
export const syncToCouchDB = async (collection, collectionName) => {
  try {
    const db = await getDB();
    const docs = await collection.find().exec();

    console.log(`Syncing ${docs.length} ${collectionName} to CouchDB...`);

    for (const doc of docs) {
      const docData = doc.toJSON();
      await syncDocumentToCouchDB(collectionName, docData);
    }

    console.log(`✅ Synced ${docs.length} ${collectionName} to CouchDB`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to sync ${collectionName} to CouchDB:`, error);
    return false;
  }
};

export const syncDocumentToCouchDB = async (collectionName, docData) => {
  try {
    const url = `${COUCHDB_URL}/${COUCHDB_DB_NAME}/${docData.id}`;
    const auth = btoa(`${COUCHDB_USERNAME}:${COUCHDB_PASSWORD}`);

    // Check if document exists
    const checkResponse = await fetch(url, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    if (checkResponse.ok) {
      // Update existing document
      const existingDoc = await checkResponse.json();
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({
          ...docData,
          _rev: existingDoc._rev,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update document: ${response.status}`);
      }
    } else {
      // Create new document
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify(docData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create document: ${response.status}`);
      }
    }

    return true;
  } catch (error) {
    console.error(`Failed to sync document ${docData.id}:`, error);
    throw error;
  }
};

export const syncFromCouchDB = async (collection, collectionName) => {
  try {
    const db = await getDB();
    const url = `${COUCHDB_URL}/${COUCHDB_DB_NAME}/_all_docs?include_docs=true`;
    const auth = btoa(`${COUCHDB_USERNAME}:${COUCHDB_PASSWORD}`);

    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from CouchDB: ${response.status}`);
    }

    const data = await response.json();
    const docs = data.rows
      .map(row => row.doc)
      .filter(doc => doc && !doc._id.startsWith('_design'));

    console.log(
      `Found ${docs.length} documents in CouchDB for ${collectionName}`,
    );

    for (const doc of docs) {
      if (doc._deleted) {
        // Remove locally if exists
        const localDoc = await collection
          .findOne({ selector: { id: doc._id } })
          .exec();
        if (localDoc) {
          await localDoc.remove();
          console.log(
            `🗑️ Deleted document ${doc._id} locally (tombstone from CouchDB)`,
          );
        }
        continue;
      }
      const { _id, _rev, ...docData } = doc;
      try {
        await collection.insert(docData);
        console.log(`✅ Synced document ${_id} from CouchDB`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`Document ${_id} already exists locally`);
        } else {
          console.error(`Failed to sync document ${_id}:`, error);
        }
      }
    }

    return true;
  } catch (error) {
    console.error(`❌ Failed to sync ${collectionName} from CouchDB:`, error);
    return false;
  }
};

// Add this function to delete a document from CouchDB
export const deleteDocumentFromCouchDB = async (collectionName, docId) => {
  try {
    const url = `${COUCHDB_URL}/${COUCHDB_DB_NAME}/${docId}`;
    const auth = btoa(`${COUCHDB_USERNAME}:${COUCHDB_PASSWORD}`);

    // Get the current revision
    const getResponse = await fetch(url, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });
    if (!getResponse.ok) {
      throw new Error(`Document not found in CouchDB: ${docId}`);
    }
    const existingDoc = await getResponse.json();

    // Mark as deleted
    const deleteResponse = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        _id: docId,
        _rev: existingDoc._rev,
        _deleted: true,
      }),
    });
    if (!deleteResponse.ok) {
      throw new Error(
        `Failed to delete document in CouchDB: ${deleteResponse.status}`,
      );
    }
    return true;
  } catch (error) {
    console.error(`Failed to delete document ${docId} from CouchDB:`, error);
    return false;
  }
};

// Setup replication for all collections
export const setupAllReplications = async () => {
  try {
    const db = await getDB();

    // Sync from CouchDB first
    await syncFromCouchDB(db.businesses, 'businesses');
    await syncFromCouchDB(db.articles, 'articles');

    // Then sync to CouchDB
    await syncToCouchDB(db.businesses, 'businesses');
    await syncToCouchDB(db.articles, 'articles');

    console.log('✅ All replications completed');
    return true;
  } catch (error) {
    console.error('❌ Failed to setup replications:', error);
    return false;
  }
};

// Check if CouchDB is accessible
export const checkCouchDBConnection = async () => {
  try {
    const response = await fetch(`${COUCHDB_URL}/`);
    if (response.ok) {
      const data = await response.json();
      console.log('CouchDB connection successful:', data);
      return true;
    } else {
      console.error('CouchDB connection failed:', response.status);
      return false;
    }
  } catch (error) {
    console.error('CouchDB connection error:', error);
    return false;
  }
};
