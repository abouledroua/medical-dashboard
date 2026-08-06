
import pool from './db.js';

async function migrate() {
  try {
    // 1. Create the new malade_measurement table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS malade_measurement (
        ID INT AUTO_INCREMENT PRIMARY KEY,
        ID_MALADE VARCHAR(50) NOT NULL,
        DATE_PRISE DATE NOT NULL,
        TAILLE VARCHAR(50),
        POIDS VARCHAR(50),
        PC VARCHAR(50),
        UNIQUE KEY (ID_MALADE, DATE_PRISE)
      )
    `);
    console.log('Table malade_measurement created or already exists.');

    // 2. Migrate data from malade_info_taille
    const [tailleData] = await pool.query('SELECT ID_MALADE, DATE_PRISE, TAILLE FROM malade_info_taille');
    for (const row of tailleData) {
      await pool.query(`
        INSERT INTO malade_measurement (ID_MALADE, DATE_PRISE, TAILLE)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE TAILLE = VALUES(TAILLE)
      `, [row.ID_MALADE, row.DATE_PRISE, row.TAILLE]);
    }
    console.log('Data from malade_info_taille migrated.');

    // 3. Migrate data from malade_info_poids
    const [poidsData] = await pool.query('SELECT ID_MALADE, DATE_PRISE, POIDS FROM malade_info_poids');
    for (const row of poidsData) {
      await pool.query(`
        INSERT INTO malade_measurement (ID_MALADE, DATE_PRISE, POIDS)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE POIDS = VALUES(POIDS)
      `, [row.ID_MALADE, row.DATE_PRISE, row.POIDS]);
    }
    console.log('Data from malade_info_poids migrated.');

    // 4. Migrate data from malade_info_pc
    const [pcData] = await pool.query('SELECT ID_MALADE, DATE_PRISE, PC FROM malade_info_pc');
    for (const row of pcData) {
      await pool.query(`
        INSERT INTO malade_measurement (ID_MALADE, DATE_PRISE, PC)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE PC = VALUES(PC)
      `, [row.ID_MALADE, row.DATE_PRISE, row.PC]);
    }
    console.log('Data from malade_info_pc migrated.');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    pool.end();
  }
}

migrate();
