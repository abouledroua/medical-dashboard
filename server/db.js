import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import mysql from 'mysql2/promise';

let db;
export let dbConfig;
export let myDB;

if (process.env.NODE_ENV === 'development') {
  // SQLite connection for development
  const dbPath = path.join(process.cwd(), 'dev.sqlite');
  open({
    filename: dbPath,
    driver: sqlite3.Database
  }).then((d) => {
    db = d;
    console.log('SQLite database connected');
    db.exec(`
      CREATE TABLE IF NOT EXISTS medicaments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        dci TEXT,
        forme TEXT
      );
    `);
  }).catch((err) => {
    console.error('Error connecting to SQLite:', err);
  });
} else {
  // MySQL connection for production
  dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'citrus',
    password: process.env.DB_PASSWORD || 'citrus21012013',
    database: process.env.DB_NAME || 'docteur5'
  };

  myDB = dbConfig.database;

  const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 30,
    queueLimit: 0,
    charset: 'utf8mb4'
  });
  db = pool;
  console.log('MySQL database pool created for production');
}

export default db;
