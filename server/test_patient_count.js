
import pool from './db.js';

async function testPatientCount() {
  try {
    const [[{ count }]] = await pool.query('SELECT COUNT(*) as count FROM malade');
    console.log('Total patients:', count);
  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    pool.end();
  }
}

testPatientCount();
