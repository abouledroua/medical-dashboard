import mysql from 'mysql2/promise';
import { dbConfig, myDB } from './db.js';

async function checkUsers() {
  const connection = await mysql.createConnection(dbConfig);

  const [tables] = await connection.query("SHOW TABLES LIKE '%user%'");
  console.log(`User-related tables in ${myDB}:`, tables);

  try {
    const [users] = await connection.query('SELECT USERNAME, PASSWORD, PASS_MOB, TYPE, ID_USER, FONCTION FROM users LIMIT 10');
    console.log(`Users in DB ${myDB}:`, users);
  } catch (err) {
    console.error(`Error querying users table in ${myDB}:`, err.message);
  }

  await connection.end();
}

checkUsers();
