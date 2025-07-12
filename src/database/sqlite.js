import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

const database_name = 'OfflineFirst.db';
const database_version = '1.0';
const database_displayname = 'Offline First Database';
const database_size = 200000;

let db;

export const initDB = async () => {
  db = await SQLite.openDatabase(
    database_name,
    database_version,
    database_displayname,
    database_size,
  );
  // Create Business table
  await db.executeSql(
    `CREATE TABLE IF NOT EXISTS Business (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL
    );`,
  );
  // Create Article table
  await db.executeSql(
    `CREATE TABLE IF NOT EXISTS Article (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      qty INTEGER NOT NULL,
      selling_price REAL NOT NULL,
      business_id TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES Business(id)
    );`,
  );
  return db;
};

export const addBusiness = async (id, name) => {
  await db.executeSql('INSERT INTO Business (id, name) VALUES (?, ?);', [
    id,
    name,
  ]);
};

export const getBusinesses = async () => {
  const [results] = await db.executeSql('SELECT * FROM Business;');
  let businesses = [];
  for (let i = 0; i < results.rows.length; i++) {
    businesses.push(results.rows.item(i));
  }
  return businesses;
};

export const addArticle = async (id, name, qty, selling_price, business_id) => {
  await db.executeSql(
    'INSERT INTO Article (id, name, qty, selling_price, business_id) VALUES (?, ?, ?, ?, ?);',
    [id, name, qty, selling_price, business_id],
  );
};

export const getArticlesByBusiness = async business_id => {
  const [results] = await db.executeSql(
    'SELECT * FROM Article WHERE business_id = ?;',
    [business_id],
  );
  let articles = [];
  for (let i = 0; i < results.rows.length; i++) {
    articles.push(results.rows.item(i));
  }
  return articles;
};

export const deleteBusiness = async id => {
  await db.executeSql('DELETE FROM Business WHERE id = ?;', [id]);
};

export const deleteArticle = async id => {
  await db.executeSql('DELETE FROM Article WHERE id = ?;', [id]);
};

export const updateBusiness = async (id, name) => {
  await db.executeSql('UPDATE Business SET name = ? WHERE id = ?;', [name, id]);
};

export const updateArticle = async (id, name, qty, selling_price) => {
  await db.executeSql(
    'UPDATE Article SET name = ?, qty = ?, selling_price = ? WHERE id = ?;',
    [name, qty, selling_price, id],
  );
};
