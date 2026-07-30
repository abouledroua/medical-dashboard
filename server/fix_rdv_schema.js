import pool from './db.js';

async function fixRdvSchema() {
  try {
    await pool.query(`
      ALTER TABLE rdv 
      MODIFY COLUMN ID_RDV INT NOT NULL AUTO_INCREMENT PRIMARY KEY
    `);
    console.log('Table `rdv` schema updated successfully. ID_RDV is now an auto-incrementing primary key.');
  } catch (err) {
    console.error('Error updating rdv table schema:', err);
  } finally {
    pool.end();
  }
}

fixRdvSchema();
