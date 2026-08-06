import pool from "../../db.js";

const columnsCache = {};
async function getTableColumns(tableName) {
  if (columnsCache[tableName]) return columnsCache[tableName];
  try {
    const [cols] = await pool.query(`SHOW COLUMNS FROM \`${tableName}\``);
    columnsCache[tableName] = cols;
    return cols;
  } catch (e) {
    return [];
  }
}

// Helper 1: Get existing ID_MEDICAMENT or insert new row in medicament table
export async function getOrCreateMedicationId(name) {
  const cleanName = name.trim();
  const [mCheck] = await pool.query(
    "SELECT ID_MEDICAMENT FROM medicament WHERE DESIGNATION = ? LIMIT 1",
    [cleanName]
  );
  if (mCheck.length > 0) {
    return mCheck[0].ID_MEDICAMENT;
  }

  const [mMax] = await pool.query("SELECT COALESCE(MAX(ID_MEDICAMENT), 0) + 1 AS nextId FROM medicament");
  const nextId = mMax[0].nextId;

  const cols = await getTableColumns("medicament");
  const fields = ["ID_MEDICAMENT", "DESIGNATION"];
  const values = [nextId, cleanName];

  for (const c of cols) {
    if (c.Field === "ID_MEDICAMENT" || c.Field === "DESIGNATION") continue;
    if (c.Null === "NO" && c.Default === null && !c.Extra.includes("auto_increment")) {
      fields.push(c.Field);
      if (c.Field.toUpperCase().startsWith("ID_") || c.Type.includes("int") || c.Type.includes("decimal") || c.Type.includes("float")) {
        values.push(0);
      } else {
        values.push("");
      }
    }
  }

  const fieldSql = fields.join(", ");
  const placeholderSql = fields.map(() => "?").join(", ");
  await pool.query(`INSERT INTO medicament (${fieldSql}) VALUES (${placeholderSql})`, values);
  return nextId;
}

// Helper 2: Get existing ID_MEDICAMENT or insert new row in medicament_p (freeform prescription) table
export async function getOrCreateMedicamentPId(prescriptionText) {
  const cleanText = prescriptionText.trim();
  const [pCheck] = await pool.query(
    "SELECT ID_MEDICAMENT FROM medicament_p WHERE PRESCRIPTION = ? LIMIT 1",
    [cleanText]
  );
  if (pCheck.length > 0) {
    return pCheck[0].ID_MEDICAMENT;
  }

  const [mMax] = await pool.query("SELECT COALESCE(MAX(ID_MEDICAMENT), 0) + 1 AS nextId FROM medicament_p");
  const nextId = mMax[0].nextId;

  const cols = await getTableColumns("medicament_p");
  const fields = ["ID_MEDICAMENT", "PRESCRIPTION"];
  const values = [nextId, cleanText];

  for (const c of cols) {
    if (c.Field === "ID_MEDICAMENT" || c.Field === "PRESCRIPTION") continue;
    if (c.Null === "NO" && c.Default === null && !c.Extra.includes("auto_increment")) {
      fields.push(c.Field);
      if (c.Field.toUpperCase().startsWith("ID_") || c.Type.includes("int") || c.Type.includes("decimal") || c.Type.includes("float")) {
        values.push(0);
      } else {
        values.push("");
      }
    }
  }

  const fieldSql = fields.join(", ");
  const placeholderSql = fields.map(() => "?").join(", ");
  try {
    await pool.query(`INSERT INTO medicament_p (${fieldSql}) VALUES (${placeholderSql})`, values);
    return nextId;
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      const [retryMax] = await pool.query("SELECT COALESCE(MAX(ID_MEDICAMENT), 0) + 1 AS nextId FROM medicament_p");
      values[0] = retryMax[0].nextId;
      await pool.query(`INSERT IGNORE INTO medicament_p (${fieldSql}) VALUES (${placeholderSql})`, values);
      return values[0];
    }
    throw err;
  }
}

// Helper: Get existing ID_FORME or insert new row in `forme` table (+ link in `forme_medicament`), even if empty
export async function getOrCreateFormeId(formeText, medId = null) {
  const cleanForme = (formeText || '').trim();
  try {
    let formeId = null;
    const [rows] = await pool.query(
      "SELECT ID_FORME FROM forme WHERE DESIGNATION = ? OR TRIM(DESIGNATION) = ? LIMIT 1",
      [cleanForme, cleanForme]
    );
    if (rows.length > 0) {
      formeId = rows[0].ID_FORME;
    } else {
      const [maxRow] = await pool.query("SELECT COALESCE(MAX(ID_FORME), 0) + 1 AS nextId FROM forme");
      formeId = maxRow[0].nextId;

      await pool.query(
        "INSERT IGNORE INTO forme (ID_FORME, DESIGNATION, ETAT) VALUES (?, ?, 1)",
        [formeId, cleanForme]
      );
    }

    // Link in pivot table forme_medicament if medId provided
    if (medId && formeId) {
      await pool.query(
        "INSERT IGNORE INTO forme_medicament (ID_MEDICAMENT, ID_FORME) VALUES (?, ?)",
        [medId, formeId]
      ).catch(() => {});
    }

    return formeId;
  } catch (err) {
    return null;
  }
}

// Helper 3: Get existing ID_DOSAGE or insert new row in dosage table
export async function getOrCreateDosageId(medId, dosageText, formeId = null) {
  if (!dosageText || !dosageText.trim()) return null;
  const cleanDosage = dosageText.trim();

  try {
    const dCols = await getTableColumns("dosage");
    if (dCols.length === 0) return null;

    const hasMedIdCol = dCols.some(c => c.Field === 'ID_MEDICAMENT');
    const hasFormeIdCol = dCols.some(c => c.Field === 'ID_FORME');
    const dosageCol = dCols.find(c => c.Field === 'DOSAGE' || c.Field === 'DESIGNATION')?.Field || "DOSAGE";
    const idCol = dCols.find(c => c.Field.toUpperCase() === 'ID_DOSAGE' || c.Field.toUpperCase() === 'ID')?.Field;

    let querySql = hasMedIdCol 
      ? `SELECT * FROM dosage WHERE ID_MEDICAMENT = ? AND \`${dosageCol}\` = ? LIMIT 1`
      : `SELECT * FROM dosage WHERE \`${dosageCol}\` = ? LIMIT 1`;
    let queryParams = hasMedIdCol ? [medId, cleanDosage] : [cleanDosage];

    const [dCheck] = await pool.query(querySql, queryParams);
    if (dCheck.length > 0) {
      if (hasFormeIdCol && formeId && (!dCheck[0].ID_FORME || dCheck[0].ID_FORME === 0)) {
        await pool.query(
          `UPDATE dosage SET ID_FORME = ? WHERE ID_MEDICAMENT = ? AND \`${dosageCol}\` = ?`,
          [formeId, medId, cleanDosage]
        ).catch(() => {});
      }
      return idCol && dCheck[0][idCol] ? dCheck[0][idCol] : (dCheck[0].ID_MEDICAMENT || 1);
    }

    if (!idCol) {
      // Table has composite PK (ID_MEDICAMENT, DOSAGE)
      const fields = [];
      const values = [];
      if (hasMedIdCol) {
        fields.push("ID_MEDICAMENT");
        values.push(medId);
      }
      if (hasFormeIdCol) {
        fields.push("ID_FORME");
        values.push(formeId || 0);
      }
      fields.push(dosageCol);
      values.push(cleanDosage);
      if (dCols.some(c => c.Field === "ETAT")) {
        fields.push("ETAT");
        values.push(1);
      }

      const fieldSql = fields.map(f => `\`${f}\``).join(", ");
      const placeholderSql = fields.map(() => "?").join(", ");
      await pool.query(`INSERT IGNORE INTO dosage (${fieldSql}) VALUES (${placeholderSql})`, values);
      return medId;
    }

    const [dMax] = await pool.query(`SELECT COALESCE(MAX(\`${idCol}\`), 0) + 1 AS nextId FROM dosage`);
    const nextId = dMax[0].nextId;

    const fields = [idCol, dosageCol];
    const values = [nextId, cleanDosage];
    if (hasMedIdCol && !fields.includes("ID_MEDICAMENT")) {
      fields.push("ID_MEDICAMENT");
      values.push(medId);
    }
    if (hasFormeIdCol && !fields.includes("ID_FORME")) {
      fields.push("ID_FORME");
      values.push(formeId || 0);
    }

    for (const c of dCols) {
      if (fields.includes(c.Field)) continue;
      if (c.Null === "NO" && c.Default === null && !c.Extra.includes("auto_increment")) {
        fields.push(c.Field);
        if (c.Field.toUpperCase().startsWith("ID_") || c.Type.includes("int") || c.Type.includes("decimal") || c.Type.includes("float")) {
          values.push(0);
        } else {
          values.push("");
        }
      }
    }

    const fieldSql = fields.map(f => `\`${f}\``).join(", ");
    const placeholderSql = fields.map(() => "?").join(", ");
    await pool.query(`INSERT IGNORE INTO dosage (${fieldSql}) VALUES (${placeholderSql})`, values);
    return nextId;
  } catch (errDos) {
    return null;
  }
}

// Helper 4: Get existing ID_FREQUENCE or insert new row in frequence table
export async function getOrCreateFrequenceId(medId, freqText) {
  if (!freqText || !freqText.trim()) return null;
  const cleanFreq = freqText.trim();

  try {
    const fCols = await getTableColumns("frequence");
    if (fCols.length === 0) return null;

    const hasMedIdCol = fCols.some(c => c.Field === 'ID_MEDICAMENT');
    const freqCol = fCols.find(c => c.Field === 'FREQUENCE' || c.Field === 'DESIGNATION')?.Field || "FREQUENCE";
    const idCol = fCols.find(c => c.Field.toUpperCase() === 'ID_FREQUENCE' || c.Field.toUpperCase() === 'ID')?.Field;

    let querySql = hasMedIdCol 
      ? `SELECT * FROM frequence WHERE ID_MEDICAMENT = ? AND \`${freqCol}\` = ? LIMIT 1`
      : `SELECT * FROM frequence WHERE \`${freqCol}\` = ? LIMIT 1`;
    let queryParams = hasMedIdCol ? [medId, cleanFreq] : [cleanFreq];

    const [fCheck] = await pool.query(querySql, queryParams);
    if (fCheck.length > 0) {
      return idCol && fCheck[0][idCol] ? fCheck[0][idCol] : (fCheck[0].ID_MEDICAMENT || 1);
    }

    if (!idCol) {
      const fields = [];
      const values = [];
      if (hasMedIdCol) {
        fields.push("ID_MEDICAMENT");
        values.push(medId);
      }
      fields.push(freqCol);
      values.push(cleanFreq);
      if (fCols.some(c => c.Field === "ETAT")) {
        fields.push("ETAT");
        values.push(1);
      }

      const fieldSql = fields.map(f => `\`${f}\``).join(", ");
      const placeholderSql = fields.map(() => "?").join(", ");
      await pool.query(`INSERT IGNORE INTO frequence (${fieldSql}) VALUES (${placeholderSql})`, values);
      return medId;
    }

    const [fMax] = await pool.query(`SELECT COALESCE(MAX(\`${idCol}\`), 0) + 1 AS nextId FROM frequence`);
    const nextId = fMax[0].nextId;

    const fields = [idCol, freqCol];
    const values = [nextId, cleanFreq];
    if (hasMedIdCol && !fields.includes("ID_MEDICAMENT")) {
      fields.push("ID_MEDICAMENT");
      values.push(medId);
    }

    for (const c of fCols) {
      if (fields.includes(c.Field)) continue;
      if (c.Null === "NO" && c.Default === null && !c.Extra.includes("auto_increment")) {
        fields.push(c.Field);
        if (c.Field.toUpperCase().startsWith("ID_") || c.Type.includes("int") || c.Type.includes("decimal") || c.Type.includes("float")) {
          values.push(0);
        } else {
          values.push("");
        }
      }
    }

    const fieldSql = fields.map(f => `\`${f}\``).join(", ");
    const placeholderSql = fields.map(() => "?").join(", ");
    await pool.query(`INSERT IGNORE INTO frequence (${fieldSql}) VALUES (${placeholderSql})`, values);
    return nextId;
  } catch (errFreq) {
    return null;
  }
}
