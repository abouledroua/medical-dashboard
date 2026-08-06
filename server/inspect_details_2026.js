import mysql from 'mysql2/promise';
import { dbConfig, myDB } from './db.js';

async function inspectDetails2026() {
  const conn = await mysql.createConnection(dbConfig);

  console.log('=== Checking details_ordonnance_2026 ===');
  const [count] = await conn.query('SELECT COUNT(*) as total FROM details_ordonnance_2026');
  console.log('Total rows in details_ordonnance_2026:', count[0].total);

  const [sample] = await conn.query('SELECT * FROM details_ordonnance_2026 LIMIT 10');
  console.log('Sample rows in details_ordonnance_2026:', sample);

  console.log('\n=== Checking ordonnance_consult_2026 ===');
  const [hCount] = await conn.query('SELECT COUNT(*) as total FROM ordonnance_consult_2026');
  console.log('Total rows in ordonnance_consult_2026:', hCount[0].total);

  const [hSample] = await conn.query('SELECT * FROM ordonnance_consult_2026 LIMIT 10');
  console.log('Sample rows in ordonnance_consult_2026:', hSample);

  await conn.end();
}

inspectDetails2026().catch(console.error);
