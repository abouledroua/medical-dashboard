import mysql from 'mysql2/promise';
import { dbConfig, myDB } from './db.js';

async function checkParametre() {
  const connection = await mysql.createConnection(dbConfig);

  const [rows] = await connection.query('SELECT * FROM parametre LIMIT 1');
  console.log('Parametre row:', rows[0]);

  await connection.end();
}

checkParametre();
