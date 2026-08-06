import mysql from 'mysql2/promise';
import { dbConfig, myDB } from './db.js';

async function testNewQueries() {
  const connection = await mysql.createConnection(dbConfig);
  console.log(`Testing new queries on database: ${myDB}`);

  // Test 1: Suggestions query
  try {
    const [suggs] = await connection.query(`
      SELECT MIN(m.ID_MEDICAMENT) as ID_MEDICAMENT, m.DESIGNATION, MAX(f.DESIGNATION) as FORME
      FROM medicament m
      LEFT JOIN forme_medicament fm ON m.ID_MEDICAMENT = fm.ID_MEDICAMENT
      LEFT JOIN forme f ON fm.ID_FORME = f.ID_FORME
      WHERE m.DESIGNATION IS NOT NULL 
        AND TRIM(m.DESIGNATION) != '' 
        AND m.DESIGNATION LIKE ? 
      GROUP BY m.DESIGNATION
      ORDER BY m.DESIGNATION ASC 
      LIMIT 5
    `, ['%AMOX%']);
    console.log('\n=== Test 1: Suggestions Query Success ===\n', suggs);
  } catch (err) {
    console.error('\n=== Test 1 Error:', err.message);
  }

  // Test 2: Formes by medication ID
  try {
    const [formes] = await connection.query(`
      SELECT DISTINCT f.DESIGNATION 
      FROM forme_medicament fm
      JOIN forme f ON fm.ID_FORME = f.ID_FORME
      WHERE fm.ID_MEDICAMENT = ? 
        AND f.DESIGNATION IS NOT NULL 
        AND TRIM(f.DESIGNATION) != '' 
      ORDER BY f.DESIGNATION ASC
    `, [1]);
    console.log('\n=== Test 2: Formes by Med ID 1 Success ===\n', formes);
  } catch (err) {
    console.error('\n=== Test 2 Error:', err.message);
  }

  // Test 3: Popular query
  try {
    const [pop] = await connection.query(`
      SELECT m.DESIGNATION as name, f.DESIGNATION as forme, d.DOSAGE as dosage, d.FREQUENCE as frequency, d.QTE as duration, COUNT(*) as cnt
      FROM details_ordonnance_2026 d
      JOIN medicament m ON d.ID_MEDICAMENT = m.ID_MEDICAMENT
      LEFT JOIN forme f ON d.ID_FORME = f.ID_FORME
      WHERE m.DESIGNATION IS NOT NULL AND TRIM(m.DESIGNATION) != ''
      GROUP BY m.DESIGNATION, f.DESIGNATION, d.DOSAGE, d.FREQUENCE, d.QTE
      LIMIT 5
    `);
    console.log('\n=== Test 3: Popular Presets Query Success ===\n', pop);
  } catch (err) {
    console.error('\n=== Test 3 Error:', err.message);
  }

  await connection.end();
}

testNewQueries().catch(console.error);
