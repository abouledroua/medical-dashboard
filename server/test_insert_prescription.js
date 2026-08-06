import mysql from 'mysql2/promise';
import { dbConfig, myDB } from './db.js';

async function testInsertPrescription() {
  const conn = await mysql.createConnection(dbConfig);
  console.log('Testing prescription insert into details_ordonnance_2026...');

  const tableName = 'details_ordonnance_2026';
  const idConsultation = 999999;
  const exercice = '2026';
  const rx = {
    name: 'AMOXICILLINE',
    forme: 'COMP',
    dosage: '1g',
    frequency: '2 fois / jour',
    duration: '7 jours'
  };

  try {
    // 1. Get medication ID
    const [mRows] = await conn.query('SELECT ID_MEDICAMENT FROM medicament WHERE DESIGNATION LIKE ? LIMIT 1', ['%AMOXICILLINE%']);
    const medId = mRows.length > 0 ? mRows[0].ID_MEDICAMENT : 1;

    // 2. Get Forme ID
    const [fRows] = await conn.query('SELECT ID_FORME FROM forme WHERE DESIGNATION = ? LIMIT 1', [rx.forme]);
    const formeId = fRows.length > 0 ? fRows[0].ID_FORME : 1;

    console.log(`Med ID: ${medId}, Forme ID: ${formeId}`);

    const [dCols] = await conn.query(`SHOW COLUMNS FROM \`${tableName}\``);
    console.log('Columns in details_ordonnance_2026:', dCols.map(c => `${c.Field} (${c.Type}) Null:${c.Null} Def:${c.Default}`));

    const rowData = {
      ID_CONSULTATION: idConsultation,
      ID_MEDICAMENT: medId,
      TYPE: 1,
      DOSAGE: rx.dosage,
      FREQUENCE: rx.frequency,
      QTE: rx.duration,
      EXERCICE: exercice,
      ID_ORDONNANCE: 1,
      ID_FORME: formeId
    };

    const dFields = [];
    const dValues = [];

    for (const c of dCols) {
      const colName = c.Field;
      if (c.Extra.includes("auto_increment")) continue;

      if (rowData[colName] !== undefined) {
        dFields.push(`\`${colName}\``);
        dValues.push(rowData[colName]);
      } else if (c.Null === "NO" && c.Default === null) {
        dFields.push(`\`${colName}\``);
        if (colName.toUpperCase().includes("ORDONNANCE")) {
          dValues.push(1);
        } else if (colName.toUpperCase().startsWith("ID_") || c.Type.includes("int") || c.Type.includes("decimal") || c.Type.includes("float")) {
          dValues.push(0);
        } else {
          dValues.push("");
        }
      }
    }

    const dFieldSql = dFields.join(", ");
    const dPlaceholderSql = dFields.map(() => "?").join(", ");
    const updateAssignments = dFields.map(f => `${f} = VALUES(${f})`).join(", ");

    const sql = `INSERT INTO \`${tableName}\` (${dFieldSql}) VALUES (${dPlaceholderSql}) ON DUPLICATE KEY UPDATE ${updateAssignments}`;
    console.log('Executing SQL:', sql);
    console.log('With values:', dValues);

    const [res] = await conn.query(sql, dValues);
    console.log('Insert result:', res);

    // Verify row was inserted
    const [rows] = await conn.query(`SELECT * FROM \`${tableName}\` WHERE ID_CONSULTATION = ?`, [idConsultation]);
    console.log('Inserted row verification:', rows);

    // Clean up test row
    await conn.query(`DELETE FROM \`${tableName}\` WHERE ID_CONSULTATION = ?`, [idConsultation]);
    console.log('Cleaned up test row.');
  } catch (err) {
    console.error('Insert prescription error:', err);
  }

  await conn.end();
}

testInsertPrescription().catch(console.error);
