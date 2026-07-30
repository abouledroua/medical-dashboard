import pool from './db.js';

async function addIdUserToRdv() {
  try {
    console.log('Attempting to add ID_USER column to rdv table...');
    // Check if the column already exists to prevent errors on re-running
    const [rows] = await pool.query(`SHOW COLUMNS FROM rdv LIKE 'ID_USER'`);
    if (rows.length === 0) {
      console.log('ID_USER column does not exist. Adding it now...');
      await pool.query(`ALTER TABLE rdv ADD COLUMN ID_USER INT DEFAULT 0`);
      console.log('Column `ID_USER` added to table `rdv` successfully.');
    } else {
      console.log('Column `ID_USER` already exists in table `rdv`. No changes made.');
    }
  } catch (err) {
    console.error('CRITICAL ERROR: Failed to add ID_USER column to rdv table.', err);
    throw err; // Re-throw the error to ensure script explicitly fails
  } finally {
    pool.end();
  }
}

addIdUserToRdv();
