import mysql from 'mysql2/promise';
import { dbConfig, myDB } from './db.js';

async function testConnection() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log(`Connected to MySQL database "${myDB}" successfully!`);

    const [tables] = await connection.query('SHOW TABLES');
    console.log(`Tables in ${myDB}:`, JSON.stringify(tables, null, 2));

    for (const tableObj of tables) {
      const tableName = Object.values(tableObj)[0];
      const [columns] = await connection.query(`DESCRIBE \`${tableName}\``);
      console.log(`\nTable Structure [${tableName}]:`);
      console.log(columns.map(c => `${c.Field} (${c.Type}) ${c.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${c.Key}`).join('\n'));
    }

    await connection.end();
  } catch (err) {
    console.error('MySQL Connection Error:', err);
  }
}

testConnection();
