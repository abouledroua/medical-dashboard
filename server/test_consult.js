import mysql from 'mysql2/promise';
import { dbConfig, myDB } from './db.js';

async function testConsultation() {
  const connection = await mysql.createConnection(dbConfig);

  const [cols] = await connection.query('DESCRIBE `consultation`');
  console.log('consultation table structure:');
  console.log(cols.map(c => `${c.Field} (${c.Type})`).join('\n'));

  const [sample] = await connection.query('SELECT * FROM `consultation` LIMIT 3');
  console.log('\nSample consultation:', sample);

  await connection.end();
}

checkConsultation();
