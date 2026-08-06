import mysql from 'mysql2/promise';

// SINGLE CENTRAL DATABASE CONFIGURATION - UPDATE HERE TO CHANGE DB CREDENTIALS & DB NAME
export const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'citrus',
  password: process.env.DB_PASSWORD || 'citrus21012013',
  database: process.env.DB_NAME || 'docteur5'
};

export const myDB = dbConfig.database;

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 30,
  queueLimit: 0,
  charset: 'utf8mb4'
});

export default pool;
