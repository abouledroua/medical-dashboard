import express from "express";
import pool from "../db.js";

const router = express.Router();

// GET /api/medications - Get all medications
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        m.ID_MEDICAMENT as id, 
        m.DESIGNATION as designation,
        m.DCI as dci,
        m.STATUT as etat,
        MAX(f.DESIGNATION) as forme,
        MAX(d.DOSAGE) as dosage
      FROM medicament m 
      LEFT JOIN forme_medicament fm ON m.ID_MEDICAMENT = fm.ID_MEDICAMENT
      LEFT JOIN forme f ON fm.ID_FORME = f.ID_FORME
      LEFT JOIN dosage d ON m.ID_MEDICAMENT = d.ID_MEDICAMENT
      GROUP BY m.ID_MEDICAMENT, m.DESIGNATION, m.DCI, m.STATUT
      ORDER BY m.DESIGNATION ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error("API GET /api/medications Error:", err);
    res.status(500).json({ error: "Failed to fetch medications" });
  }
});

const defaultPopularPresets = [
  {
    name: "Amoxicilline",
    forme: "Gélule",
    dosage: "1g",
    frequency: "2 fois / jour",
    duration: "7 jours",
  },
  {
    name: "Paracétamol",
    forme: "Comprimé",
    dosage: "1g",
    frequency: "3 fois / jour",
    duration: "5 jours",
  },
  {
    name: "Solupred",
    forme: "Comprimé",
    dosage: "20mg",
    frequency: "1 fois / jour",
    duration: "5 jours",
  },
  {
    name: "Oflocet Auriculaire",
    forme: "Gouttes",
    dosage: "5 gouttes",
    frequency: "2 fois / jour",
    duration: "7 jours",
  },
  {
    name: "Rhinoflux Spray",
    forme: "Spray",
    dosage: "2 pulvérisations",
    frequency: "3 fois / jour",
    duration: "5 jours",
  },
  {
    name: "Augmentin",
    forme: "Sachet",
    dosage: "1g",
    frequency: "2 fois / jour",
    duration: "7 jours",
  },
];

// GET /api/medications/popular - Get top most used medications with most common forme, dosage, frequency, and duration
router.get("/popular", async (req, res) => {
  try {
    const [tables] = await pool.query(
      "SHOW TABLES LIKE 'details_ordonnance_%'",
    );
    const tableNames = tables
      .map((t) => Object.values(t)[0])
      .filter(
        (tName) =>
          typeof tName === "string" && tName.startsWith("details_ordonnance_"),
      );

    if (tableNames.length === 0) {
      const [singleCheck] = await pool.query(
        "SHOW TABLES LIKE 'details_ordonnance'",
      );
      if (singleCheck.length > 0) tableNames.push("details_ordonnance");
    }

    if (tableNames.length === 0) {
      return res.json(defaultPopularPresets);
    }

    const sqlQueries = tableNames.map(
      (
        tbl,
      ) => `SELECT m.DESIGNATION as name, f.DESIGNATION as forme, d.DOSAGE as dosage, d.FREQUENCE as frequency, d.QTE as duration, COUNT(*) as cnt
              FROM \`${tbl}\` d
              JOIN medicament m ON d.ID_MEDICAMENT = m.ID_MEDICAMENT
              LEFT JOIN forme f ON d.ID_FORME = f.ID_FORME
              WHERE m.DESIGNATION IS NOT NULL AND TRIM(m.DESIGNATION) != ''
              GROUP BY m.DESIGNATION, f.DESIGNATION, d.DOSAGE, d.FREQUENCE, d.QTE`,
    );

    const fullSql = `SELECT name, forme, dosage, frequency, duration, SUM(cnt) as total_count 
                     FROM (${sqlQueries.join(" UNION ALL ")}) AS combined 
                     GROUP BY name, forme, dosage, frequency, duration 
                     ORDER BY total_count DESC 
                     LIMIT 30`;

    let rows = [];
    try {
      const [results] = await pool.query(fullSql);
      rows = results;
    } catch (eSql) {
      const fallbackQueries = tableNames.map(
        (
          tbl,
        ) => `SELECT m.DESIGNATION as name, d.DOSAGE as dosage, d.FREQUENCE as frequency, d.QTE as duration, COUNT(*) as cnt
                FROM \`${tbl}\` d
                JOIN medicament m ON d.ID_MEDICAMENT = m.ID_MEDICAMENT
                WHERE m.DESIGNATION IS NOT NULL AND TRIM(m.DESIGNATION) != ''
                GROUP BY m.DESIGNATION, d.DOSAGE, d.FREQUENCE, d.QTE`,
      );
      const [results] = await pool.query(
        `SELECT name, dosage, frequency, duration, SUM(cnt) as total_count 
         FROM (${fallbackQueries.join(" UNION ALL ")}) AS combined 
         GROUP BY name, dosage, frequency, duration 
         ORDER BY total_count DESC 
         LIMIT 30`,
      );
      rows = results;
    }

    if (rows.length > 0) {
      const seenNames = new Set();
      const uniquePresets = [];

      for (const r of rows) {
        const rawName = r.name ? r.name.trim() : "";
        const normKey = rawName.toLowerCase();
        if (!normKey || seenNames.has(normKey)) continue;

        seenNames.add(normKey);
        uniquePresets.push({
          name: rawName,
          forme: r.forme ? r.forme.trim() : "",
          dosage: r.dosage ? r.dosage.trim() : "1 comprimé",
          frequency: r.frequency ? r.frequency.trim() : "2 fois / jour",
          duration: r.duration ? r.duration.trim() : "7 jours",
        });

        if (uniquePresets.length >= 6) break;
      }

      if (uniquePresets.length > 0) {
        return res.json(uniquePresets);
      }
    }

    return res.json(defaultPopularPresets);
  } catch (err) {
    console.error("API GET /api/medications/popular Error:", err);
    res.json(defaultPopularPresets);
  }
});

// GET /api/medications/suggestions - Search DISTINCT medications by DESIGNATION from 'medicament' table + JOIN 'forme_medicament' + 'forme'
router.get("/suggestions", async (req, res) => {
  try {
    const qStr = req.query.q ? req.query.q.trim() : "";
    const query = qStr ? `%${qStr}%` : "%";

    let rows = [];
    try {
      const [resRows] = await pool.query(
        `SELECT MIN(m.ID_MEDICAMENT) as ID_MEDICAMENT, m.DESIGNATION, MAX(f.DESIGNATION) as FORME
         FROM medicament m
         LEFT JOIN forme_medicament fm ON m.ID_MEDICAMENT = fm.ID_MEDICAMENT
         LEFT JOIN forme f ON fm.ID_FORME = f.ID_FORME
         WHERE m.DESIGNATION IS NOT NULL 
           AND TRIM(m.DESIGNATION) != '' 
           AND m.DESIGNATION LIKE ? 
         GROUP BY m.DESIGNATION
         ORDER BY m.DESIGNATION ASC 
         LIMIT 40`,
        [query],
      );
      rows = resRows;
    } catch (eJoin) {
      const [resRows] = await pool.query(
        `SELECT MIN(ID_MEDICAMENT) as ID_MEDICAMENT, DESIGNATION
         FROM medicament 
         WHERE DESIGNATION IS NOT NULL 
           AND TRIM(DESIGNATION) != '' 
           AND DESIGNATION LIKE ? 
         GROUP BY DESIGNATION
         ORDER BY DESIGNATION ASC 
         LIMIT 40`,
        [query],
      );
      rows = resRows;
    }

    res.json(
      rows.map((r) => ({
        id: r.ID_MEDICAMENT,
        designation: r.DESIGNATION ? r.DESIGNATION.trim() : "",
        forme: r.FORME ? r.FORME.trim() : "",
      })),
    );
  } catch (err) {
    console.error("API GET /api/medications/suggestions Error:", err);
    res.status(500).json({ error: "Failed to fetch medication suggestions" });
  }
});

// GET /api/medications/resolve - Resolve ID_MEDICAMENT and ID_FORME from text designations
router.get("/resolve", async (req, res) => {
  try {
    const { medication, forme } = req.query;
    let medId = null;
    let formeId = null;

    if (medication && medication.trim()) {
      const [mRows] = await pool.query(
        "SELECT ID_MEDICAMENT FROM medicament WHERE DESIGNATION = ? OR LOWER(TRIM(DESIGNATION)) = LOWER(?) LIMIT 1",
        [medication.trim(), medication.trim()],
      );
      if (mRows.length > 0) medId = mRows[0].ID_MEDICAMENT;
    }

    if (forme && forme.trim()) {
      const [fRows] = await pool.query(
        "SELECT ID_FORME FROM forme WHERE DESIGNATION = ? OR LOWER(TRIM(DESIGNATION)) = LOWER(?) LIMIT 1",
        [forme.trim(), forme.trim()],
      );
      if (fRows.length > 0) formeId = fRows[0].ID_FORME;
    }

    res.json({ medId, formeId });
  } catch (err) {
    console.error("API GET /api/medications/resolve Error:", err);
    res.json({ medId: null, formeId: null });
  }
});

// GET /api/medications/forme - Get Forme designation from 'forme' table for selected medication name or ID
router.get("/forme", async (req, res) => {
  try {
    const { id, name } = req.query;
    let forme = "";

    if (id) {
      const [rows] = await pool.query(
        `SELECT DISTINCT f.DESIGNATION 
         FROM forme_medicament fm
         JOIN forme f ON fm.ID_FORME = f.ID_FORME
         WHERE fm.ID_MEDICAMENT = ? AND f.DESIGNATION IS NOT NULL AND TRIM(f.DESIGNATION) != '' LIMIT 1`,
        [id],
      );
      if (rows.length > 0 && rows[0].DESIGNATION)
        forme = rows[0].DESIGNATION.trim();
    } else if (name && name.trim()) {
      const [rows] = await pool.query(
        `SELECT DISTINCT f.DESIGNATION 
         FROM medicament m
         JOIN forme_medicament fm ON m.ID_MEDICAMENT = fm.ID_MEDICAMENT
         JOIN forme f ON fm.ID_FORME = f.ID_FORME
         WHERE m.DESIGNATION = ? AND f.DESIGNATION IS NOT NULL AND TRIM(f.DESIGNATION) != '' LIMIT 1`,
        [name.trim()],
      );
      if (rows.length > 0 && rows[0].DESIGNATION)
        forme = rows[0].DESIGNATION.trim();
    }

    res.json({ forme });
  } catch (err) {
    console.error("API GET /api/medications/forme Error:", err);
    res.json({ forme: "" });
  }
});

// GET /api/medications/formes - Get list of medication forms from 'forme' table for selected medication (or general if none)
router.get("/formes", async (req, res) => {
  try {
    const { id, name, q } = req.query;
    let rows = [];
    const qStr = q && q.trim() ? `%${q.trim()}%` : "%";

    if (id) {
      const [results] = await pool.query(
        `SELECT DISTINCT f.ID_FORME as id, f.DESIGNATION as designation 
         FROM forme_medicament fm
         JOIN forme f ON fm.ID_FORME = f.ID_FORME
         WHERE fm.ID_MEDICAMENT = ? 
           AND f.DESIGNATION IS NOT NULL 
           AND TRIM(f.DESIGNATION) != '' 
           AND f.DESIGNATION LIKE ?
         ORDER BY f.DESIGNATION ASC`,
        [id, qStr],
      );
      rows = results;

      if (rows.length === 0) {
        const [dResults] = await pool.query(
          `SELECT DISTINCT f.ID_FORME as id, f.DESIGNATION as designation 
           FROM dosage d
           JOIN forme f ON d.ID_FORME = f.ID_FORME
           WHERE d.ID_MEDICAMENT = ? 
             AND f.DESIGNATION IS NOT NULL 
             AND TRIM(f.DESIGNATION) != '' 
             AND f.DESIGNATION LIKE ?
           ORDER BY f.DESIGNATION ASC`,
          [id, qStr],
        );
        rows = dResults;
      }
    } else if (name && name.trim()) {
      const [results] = await pool.query(
        `SELECT DISTINCT f.ID_FORME as id, f.DESIGNATION as designation 
         FROM medicament m
         JOIN forme_medicament fm ON m.ID_MEDICAMENT = fm.ID_MEDICAMENT
         JOIN forme f ON fm.ID_FORME = f.ID_FORME
         WHERE m.DESIGNATION = ? 
           AND f.DESIGNATION IS NOT NULL 
           AND TRIM(f.DESIGNATION) != '' 
           AND f.DESIGNATION LIKE ?
         ORDER BY f.DESIGNATION ASC`,
        [name.trim(), qStr],
      );
      rows = results;

      if (rows.length === 0) {
        const [dResults] = await pool.query(
          `SELECT DISTINCT f.ID_FORME as id, f.DESIGNATION as designation 
           FROM dosage d
           JOIN medicament m ON d.ID_MEDICAMENT = m.ID_MEDICAMENT
           JOIN forme f ON d.ID_FORME = f.ID_FORME
           WHERE m.DESIGNATION = ? 
             AND f.DESIGNATION IS NOT NULL 
             AND TRIM(f.DESIGNATION) != '' 
             AND f.DESIGNATION LIKE ?
           ORDER BY f.DESIGNATION ASC`,
          [name.trim(), qStr],
        );
        rows = dResults;
      }
    }

    if (rows.length === 0) {
      const [allForms] = await pool.query(
        `SELECT DISTINCT ID_FORME as id, DESIGNATION as designation 
         FROM forme 
         WHERE DESIGNATION IS NOT NULL 
           AND TRIM(DESIGNATION) != '' 
           AND DESIGNATION LIKE ? 
         ORDER BY DESIGNATION ASC 
         LIMIT 50`,
        [qStr],
      );
      rows = allForms;
    }

    const cleanRows = rows
      .map((r) => ({
        id: r.id,
        designation: r.designation ? r.designation.trim() : "",
      }))
      .filter((r) => r.designation && r.designation.length > 0);

    res.json(cleanRows);
  } catch (err) {
    console.error("API GET /api/medications/formes Error:", err);
    res.json([]);
  }
});

// GET /api/medications/dosages - Get dosage suggestions from 'dosage' table for selected medication ID/name and form ID/name
router.get("/dosages", async (req, res) => {
  try {
    const { id, name, formeId, forme, q } = req.query;
    let rows = [];

    let resolvedMedId = id || null;
    let resolvedFormeId = formeId || null;
    const cleanMedName = (name || "").trim();
    const cleanFormeName = (forme || "").trim();

    if (!resolvedMedId && cleanMedName) {
      try {
        const [mRows] = await pool.query(
          "SELECT ID_MEDICAMENT FROM medicament WHERE DESIGNATION = ? OR LOWER(TRIM(DESIGNATION)) = LOWER(?) LIMIT 1",
          [cleanMedName, cleanMedName],
        );
        if (mRows.length > 0) resolvedMedId = mRows[0].ID_MEDICAMENT;
      } catch (e) {}
    }

    if (!resolvedFormeId && cleanFormeName) {
      try {
        const [fRows] = await pool.query(
          "SELECT ID_FORME FROM forme WHERE DESIGNATION = ? OR LOWER(TRIM(DESIGNATION)) = LOWER(?) LIMIT 1",
          [cleanFormeName, cleanFormeName],
        );
        if (fRows.length > 0) resolvedFormeId = fRows[0].ID_FORME;
      } catch (e) {}
    }

    // 1. Primary query: 'dosage' table filtered by medication AND form (using ID_FORME or forme DESIGNATION)
    if (resolvedMedId || cleanMedName) {
      if (resolvedFormeId || cleanFormeName) {
        const [results] = await pool.query(
          `SELECT DISTINCT d.DOSAGE 
           FROM dosage d
           LEFT JOIN forme f ON d.ID_FORME = f.ID_FORME
           LEFT JOIN medicament m ON d.ID_MEDICAMENT = m.ID_MEDICAMENT
           WHERE (d.ID_MEDICAMENT = ? OR m.DESIGNATION = ? OR LOWER(TRIM(m.DESIGNATION)) = LOWER(?))
             AND (
               (d.ID_FORME IS NOT NULL AND d.ID_FORME = ?) 
               OR (f.DESIGNATION IS NOT NULL AND (f.DESIGNATION = ? OR LOWER(TRIM(f.DESIGNATION)) = LOWER(?)))
             )
             AND d.DOSAGE IS NOT NULL 
             AND TRIM(d.DOSAGE) != '' 
           ORDER BY d.DOSAGE ASC`,
          [
            resolvedMedId || 0,
            cleanMedName,
            cleanMedName,
            resolvedFormeId || 0,
            cleanFormeName,
            cleanFormeName,
          ],
        );
        rows = results;
      }
    }

    // 2. Secondary query: details_ordonnance_% tables filtered by medication AND form (ID_FORME or f.DESIGNATION)
    if (
      rows.length === 0 &&
      (resolvedMedId || cleanMedName) &&
      (resolvedFormeId || cleanFormeName)
    ) {
      try {
        const [tables] = await pool.query(
          "SHOW TABLES LIKE 'details_ordonnance_%'",
        );
        const tableNames = tables
          .map((t) => Object.values(t)[0])
          .filter(
            (tName) =>
              typeof tName === "string" &&
              tName.startsWith("details_ordonnance_"),
          );

        if (tableNames.length === 0) {
          const [singleCheck] = await pool.query(
            "SHOW TABLES LIKE 'details_ordonnance'",
          );
          if (singleCheck.length > 0) tableNames.push("details_ordonnance");
        }

        if (tableNames.length > 0) {
          const sqlQueries = tableNames.map(
            (tbl) => `SELECT DISTINCT d.DOSAGE 
                    FROM \`${tbl}\` d 
                    LEFT JOIN forme f ON d.ID_FORME = f.ID_FORME
                    LEFT JOIN medicament m ON d.ID_MEDICAMENT = m.ID_MEDICAMENT
                    WHERE (d.ID_MEDICAMENT = ? OR m.DESIGNATION = ? OR LOWER(TRIM(m.DESIGNATION)) = LOWER(?))
                      AND (
                        (d.ID_FORME IS NOT NULL AND d.ID_FORME = ?) 
                        OR (f.DESIGNATION IS NOT NULL AND (f.DESIGNATION = ? OR LOWER(TRIM(f.DESIGNATION)) = LOWER(?)))
                      )
                      AND d.DOSAGE IS NOT NULL AND TRIM(d.DOSAGE) != ''`,
          );
          const fullSql = `SELECT DISTINCT DOSAGE FROM (${sqlQueries.join(" UNION ")}) AS combined ORDER BY DOSAGE ASC LIMIT 30`;
          const queryParams = [];
          tableNames.forEach(() => {
            queryParams.push(
              resolvedMedId || 0,
              cleanMedName,
              cleanMedName,
              resolvedFormeId || 0,
              cleanFormeName,
              cleanFormeName,
            );
          });
          const [dtlResults] = await pool.query(fullSql, queryParams);
          rows = dtlResults;
        }
      } catch (eDtl) {}
    }

    // 3. Fallback: if a form was specified (cleanFormeName or resolvedFormeId), search 'dosage' table by form alone across all medications before falling back to med alone
    if (rows.length === 0 && (resolvedFormeId || cleanFormeName)) {
      const [fResults] = await pool.query(
        `SELECT DISTINCT d.DOSAGE 
         FROM dosage d
         LEFT JOIN forme f ON d.ID_FORME = f.ID_FORME
         WHERE (
           (d.ID_FORME IS NOT NULL AND d.ID_FORME = ?) 
           OR (f.DESIGNATION IS NOT NULL AND (f.DESIGNATION = ? OR LOWER(TRIM(f.DESIGNATION)) = LOWER(?)))
         )
         AND d.DOSAGE IS NOT NULL 
         AND TRIM(d.DOSAGE) != '' 
         ORDER BY d.DOSAGE ASC LIMIT 30`,
        [resolvedFormeId || 0, cleanFormeName, cleanFormeName],
      );
      rows = fResults;
    }

    // 4. Fallback: if NO form was specified at all, query by medication alone
    if (
      rows.length === 0 &&
      !cleanFormeName &&
      !resolvedFormeId &&
      (resolvedMedId || cleanMedName)
    ) {
      const [results] = await pool.query(
        `SELECT DISTINCT d.DOSAGE 
         FROM dosage d
         LEFT JOIN medicament m ON d.ID_MEDICAMENT = m.ID_MEDICAMENT
         WHERE (d.ID_MEDICAMENT = ? OR m.DESIGNATION = ? OR LOWER(TRIM(m.DESIGNATION)) = LOWER(?))
           AND d.DOSAGE IS NOT NULL 
           AND TRIM(d.DOSAGE) != '' 
         ORDER BY d.DOSAGE ASC`,
        [resolvedMedId || 0, cleanMedName, cleanMedName],
      );
      rows = results;
    }

    // 5. Fallback: general search query q
    if (rows.length === 0 && q && q.trim()) {
      const qStr = `%${q.trim()}%`;
      const [results] = await pool.query(
        `SELECT DISTINCT DOSAGE 
         FROM dosage 
         WHERE DOSAGE IS NOT NULL 
           AND TRIM(DOSAGE) != '' 
           AND DOSAGE LIKE ? 
         ORDER BY DOSAGE ASC 
         LIMIT 40`,
        [qStr],
      );
      rows = results;
    }

    res.json(
      rows.map((r) => (r.DOSAGE ? r.DOSAGE.trim() : "")).filter(Boolean),
    );
  } catch (err) {
    console.error("API GET /api/medications/dosages Error:", err);
    res.json([]);
  }
});

// GET /api/medications/frequencies - Get posologie/fréquence suggestions from exercise prescription tables (details_ordonnance_exercice.FREQUENCE)
router.get("/frequencies", async (req, res) => {
  try {
    const { id, name, q } = req.query;

    // 1. Fetch FREQ_MEDIC from parametre table
    let freqMedic = 1;
    try {
      const [pRows] = await pool.query(
        "SELECT FREQ_MEDIC FROM parametre LIMIT 1",
      );
      if (
        pRows.length > 0 &&
        pRows[0].FREQ_MEDIC !== null &&
        pRows[0].FREQ_MEDIC !== undefined
      ) {
        freqMedic = Number(pRows[0].FREQ_MEDIC);
      }
    } catch (eParam) {
      console.warn(
        "Could not fetch FREQ_MEDIC from parametre:",
        eParam.message,
      );
    }

    // 2. Discover exercise details tables (details_ordonnance_YYYY)
    const [tables] = await pool.query(
      "SHOW TABLES LIKE 'details_ordonnance_%'",
    );
    const tableNames = tables
      .map((t) => Object.values(t)[0])
      .filter(
        (tName) =>
          typeof tName === "string" && tName.startsWith("details_ordonnance_"),
      );

    if (tableNames.length === 0) {
      const [singleCheck] = await pool.query(
        "SHOW TABLES LIKE 'details_ordonnance'",
      );
      if (singleCheck.length > 0) tableNames.push("details_ordonnance");
    }

    if (tableNames.length === 0) {
      return res.json([]);
    }

    // 3. Resolve target medId if freqMedic === 1 and medName is provided
    let targetMedId = id || null;
    if (freqMedic === 1 && !targetMedId && name && name.trim()) {
      try {
        const [mRows] = await pool.query(
          "SELECT ID_MEDICAMENT FROM medicament WHERE DESIGNATION = ? LIMIT 1",
          [name.trim()],
        );
        if (mRows.length > 0) {
          targetMedId = mRows[0].ID_MEDICAMENT;
        }
      } catch (eMed) {
        // ignore
      }
    }

    // 4. Build UNION query over discovered exercise tables
    const filterByMed =
      freqMedic === 1 && targetMedId !== null && targetMedId !== undefined;
    const sqlQueries = [];
    const params = [];

    for (const tbl of tableNames) {
      if (filterByMed) {
        sqlQueries.push(
          `SELECT DISTINCT FREQUENCE FROM \`${tbl}\` WHERE ID_MEDICAMENT = ? AND FREQUENCE IS NOT NULL AND TRIM(FREQUENCE) != ''`,
        );
        params.push(targetMedId);
      } else {
        if (q && q.trim()) {
          sqlQueries.push(
            `SELECT DISTINCT FREQUENCE FROM \`${tbl}\` WHERE FREQUENCE IS NOT NULL AND TRIM(FREQUENCE) != '' AND FREQUENCE LIKE ?`,
          );
          params.push(`%${q.trim()}%`);
        } else {
          sqlQueries.push(
            `SELECT DISTINCT FREQUENCE FROM \`${tbl}\` WHERE FREQUENCE IS NOT NULL AND TRIM(FREQUENCE) != ''`,
          );
        }
      }
    }

    const fullSql = `SELECT DISTINCT FREQUENCE FROM (${sqlQueries.join(" UNION ")}) AS combined ORDER BY FREQUENCE ASC LIMIT 50`;
    const [rows] = await pool.query(fullSql, params);

    res.json(
      rows.map((r) => (r.FREQUENCE ? r.FREQUENCE.trim() : "")).filter(Boolean),
    );
  } catch (err) {
    console.error("API GET /api/medications/frequencies Error:", err);
    res.json([]);
  }
});

// GET /api/medications/durations - Get duration/quantity suggestions from 'qte' table (qte.DESIGNATION)
router.get("/durations", async (req, res) => {
  try {
    const qStr = req.query.q ? req.query.q.trim() : "";
    const query = qStr ? `%${qStr}%` : "%";

    const [rows] = await pool.query(
      `SELECT DISTINCT DESIGNATION 
       FROM qte 
       WHERE DESIGNATION IS NOT NULL 
         AND TRIM(DESIGNATION) != '' 
         AND DESIGNATION LIKE ? 
       ORDER BY DESIGNATION ASC 
       LIMIT 50`,
      [query],
    );

    res.json(
      rows
        .map((r) => (r.DESIGNATION ? r.DESIGNATION.trim() : ""))
        .filter(Boolean),
    );
  } catch (err) {
    console.error("API GET /api/medications/durations Error:", err);
    res.json([]);
  }
});

// GET /api/medications/prescriptions - Get freeform prescription suggestions from 'medicament_p' table (medicament_p.PRESCRIPTION)
router.get("/prescriptions", async (req, res) => {
  try {
    const qStr = req.query.q ? req.query.q.trim() : "";
    const query = qStr ? `%${qStr}%` : "%";

    const [rows] = await pool.query(
      `SELECT DISTINCT PRESCRIPTION 
       FROM medicament_p 
       WHERE PRESCRIPTION IS NOT NULL 
         AND TRIM(PRESCRIPTION) != '' 
         AND PRESCRIPTION LIKE ? 
       ORDER BY PRESCRIPTION ASC 
       LIMIT 50`,
      [query],
    );

    res.json(
      rows
        .map((r) => (r.PRESCRIPTION ? r.PRESCRIPTION.trim() : ""))
        .filter(Boolean),
    );
  } catch (err) {
    console.error("API GET /api/medications/prescriptions Error:", err);
    res.json([]);
  }
});

// POST /api/medications - Add a new medication
router.post("/", async (req, res) => {
  const { designation, format, conditionnement, dci } = req.body;
  try {
    const [result] = await pool.query(
      "INSERT INTO medicament (DESIGNATION, FORMAT, CONDITIONNEMENT, DCI, STATUT) VALUES (?, ?, ?, ?, ?)",
      [designation, format, conditionnement, dci, 1],
    );
    res
      .status(201)
      .json({
        id: result.insertId,
        designation,
        format,
        conditionnement,
        dci,
        status: 1,
      });
  } catch (err) {
    console.error("API POST /api/medications Error:", err);
    res.status(500).json({ error: "Failed to add medication" });
  }
});

// PUT /api/medications/:id - Update a medication
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { designation, format, conditionnement, dci } = req.body;
  try {
    await pool.query(
      "UPDATE medicament SET DESIGNATION = ?, FORMAT = ?, CONDITIONNEMENT = ?, DCI = ? WHERE ID_MEDICAMENT = ?",
      [designation, format, conditionnement, dci, id],
    );
    res.json({ id, designation, format, conditionnement, dci });
  } catch (err) {
    console.error(`API PUT /api/medications/${id} Error:`, err);
    res.status(500).json({ error: "Failed to update medication" });
  }
});

// DELETE /api/medications/:id - Delete a medication
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM medicament WHERE ID_MEDICAMENT = ?", [id]);
    res.status(204).send();
  } catch (err) {
    console.error(`API DELETE /api/medications/${id} Error:`, err);
    res.status(500).json({ error: "Failed to delete medication" });
  }
});

// PUT /api/medications/:id/activate - Activate a medication
router.put("/:id/activate", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      "UPDATE medicament SET STATUT = 1 WHERE ID_MEDICAMENT = ?",
      [id],
    );
    res.json({ id, status: 1 });
  } catch (err) {
    console.error(`API PUT /api/medications/${id}/activate Error:`, err);
    res.status(500).json({ error: "Failed to activate medication" });
  }
});

// PUT /api/medications/:id/deactivate - Deactivate a medication
router.put("/:id/deactivate", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      "UPDATE medicament SET STATUT = 0 WHERE ID_MEDICAMENT = ?",
      [id],
    );
    res.json({ id, status: 0 });
  } catch (err) {
    console.error(`API PUT /api/medications/${id}/deactivate Error:`, err);
    res.status(500).json({ error: "Failed to deactivate medication" });
  }
});

export default router;
