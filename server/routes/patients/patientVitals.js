import express from "express";
import pool from "../../db.js";

const router = express.Router();

// GET /api/patients/:id/vitals-history - Get patient's vitals history
router.get("/:id/vitals-history", async (req, res) => {
  try {
    const patId = req.params.id;
    const [patientRows] = await pool.query(
      "SELECT CODE_BARRE, CODE_MALADE FROM malade WHERE CODE_BARRE = ? OR CODE_MALADE = ?",
      [patId, patId]
    );

    if (patientRows.length === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const patientIds = [patientRows[0].CODE_BARRE, patientRows[0].CODE_MALADE].filter(Boolean);

    const [htaRows] = await pool.query(
      "SELECT DATE_FORMAT(DATE_HTA, '%Y-%m-%d') as date, HTA, BATEMENT FROM hta_malade WHERE ID_MALADE IN (?) ORDER BY DATE_HTA DESC",
      [patientIds]
    );

    const [spo2Rows] = await pool.query(
      "SELECT DATE_FORMAT(DATE_PRISE, '%Y-%m-%d') as date, SPO2 FROM spo2_malade WHERE ID_MALADE IN (?) ORDER BY DATE_PRISE DESC",
      [patientIds]
    );

    const [bgRows] = await pool.query(
      "SELECT DATE_FORMAT(DATE_PRISE, '%Y-%m-%d') as date, BG FROM bg_malade WHERE ID_MALADE IN (?) ORDER BY DATE_PRISE DESC",
      [patientIds]
    );

    const vitalsByDate = {};

    htaRows.forEach(row => {
      if (!vitalsByDate[row.date]) {
        vitalsByDate[row.date] = { date: row.date, bp: 'N/A', hr: 'N/A', spo2: 'N/A', bg: 'N/A' };
      }
      vitalsByDate[row.date].bp = row.HTA;
      vitalsByDate[row.date].hr = row.BATEMENT;
    });

    spo2Rows.forEach(row => {
      if (!vitalsByDate[row.date]) {
        vitalsByDate[row.date] = { date: row.date, bp: 'N/A', hr: 'N/A', spo2: 'N/A', bg: 'N/A' };
      }
      vitalsByDate[row.date].spo2 = row.SPO2;
    });

    bgRows.forEach(row => {
      if (!vitalsByDate[row.date]) {
        vitalsByDate[row.date] = { date: row.date, bp: 'N/A', hr: 'N/A', spo2: 'N/A', bg: 'N/A' };
      }
      vitalsByDate[row.date].bg = row.BG;
    });

    const sortedVitals = Object.values(vitalsByDate).sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(sortedVitals);
  } catch (err) {
    console.error("API GET /api/patients/:id/vitals-history Error:", err);
    res.status(500).json({ error: "Failed to fetch vitals history" });
  }
});

// POST /api/patients/:id/vitals - Save/Update/Delete patient vitals
router.post("/:id/vitals", async (req, res) => {
  try {
    const patId = req.params.id;
    const { bp, hr, spo2, bg, date } = req.body;

    const [patientRows] = await pool.query(
      "SELECT CODE_BARRE, CODE_MALADE FROM malade WHERE CODE_BARRE = ? OR CODE_MALADE = ?",
      [patId, patId]
    );

    if (patientRows.length === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const patientIds = Array.from(new Set([patientRows[0].CODE_BARRE, patientRows[0].CODE_MALADE].filter(Boolean)));
    if (patientIds.length === 0) {
      return res.status(400).json({ error: "Patient has no valid ID" });
    }
    const patientIdForInsert = patientIds[0];
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Sync hta_malade (TA & Battement/Heart Rate)
    const bpStr = bp !== undefined && bp !== null ? String(bp).trim() : '';
    const hrStr = hr !== undefined && hr !== null ? String(hr).trim() : '';

    await pool.query("DELETE FROM hta_malade WHERE ID_MALADE IN (?) AND DATE_HTA = ?", [patientIds, targetDate]);
    if (bpStr || hrStr) {
      let nextHtaId = 1;
      try {
        const [maxHta] = await pool.query("SELECT COALESCE(MAX(ID), 0) + 1 AS nextId FROM hta_malade");
        nextHtaId = maxHta[0]?.nextId || 1;
        await pool.query(
          "INSERT INTO hta_malade (ID, ID_MALADE, DATE_HTA, HTA, BATEMENT) VALUES (?, ?, ?, ?, ?)",
          [nextHtaId, patientIdForInsert, targetDate, bpStr, hrStr]
        );
      } catch (e1) {
        await pool.query(
          "INSERT INTO hta_malade (ID_MALADE, DATE_HTA, HTA, BATEMENT) VALUES (?, ?, ?, ?)",
          [patientIdForInsert, targetDate, bpStr, hrStr]
        );
      }
    }

    // Sync spo2_malade
    const rawSpo2 = spo2 !== undefined && spo2 !== null ? String(spo2).replace('%', '').trim() : '';
    const numSpo2 = parseFloat(rawSpo2);
    await pool.query("DELETE FROM spo2_malade WHERE ID_MALADE IN (?) AND DATE_PRISE = ?", [patientIds, targetDate]);
    if (!isNaN(numSpo2)) {
      let nextSpo2Id = 1;
      try {
        const [maxSpo2] = await pool.query("SELECT COALESCE(MAX(ID), 0) + 1 AS nextId FROM spo2_malade");
        nextSpo2Id = maxSpo2[0]?.nextId || 1;
        await pool.query(
          "INSERT INTO spo2_malade (ID, ID_MALADE, DATE_PRISE, SPO2) VALUES (?, ?, ?, ?)",
          [nextSpo2Id, patientIdForInsert, targetDate, numSpo2]
        );
      } catch (e2) {
        await pool.query(
          "INSERT INTO spo2_malade (ID_MALADE, DATE_PRISE, SPO2) VALUES (?, ?, ?)",
          [patientIdForInsert, targetDate, numSpo2]
        );
      }
    }

    // Sync bg_malade
    const rawBg = bg !== undefined && bg !== null ? String(bg).trim() : '';
    const numBg = parseFloat(rawBg);
    await pool.query("DELETE FROM bg_malade WHERE ID_MALADE IN (?) AND DATE_PRISE = ?", [patientIds, targetDate]);
    if (!isNaN(numBg)) {
      let nextBgId = 1;
      try {
        const [maxBg] = await pool.query("SELECT COALESCE(MAX(ID), 0) + 1 AS nextId FROM bg_malade");
        nextBgId = maxBg[0]?.nextId || 1;
        await pool.query(
          "INSERT INTO bg_malade (ID, ID_MALADE, DATE_PRISE, BG) VALUES (?, ?, ?, ?)",
          [nextBgId, patientIdForInsert, targetDate, numBg]
        );
      } catch (e3) {
        await pool.query(
          "INSERT INTO bg_malade (ID_MALADE, DATE_PRISE, BG) VALUES (?, ?, ?)",
          [patientIdForInsert, targetDate, numBg]
        );
      }
    }

    res.json({ success: true, message: "Vitals synchronized successfully." });
  } catch (err) {
    console.error("API POST /api/patients/:id/vitals Error:", err);
    res.status(500).json({ error: "Failed to synchronize vitals" });
  }
});

// DELETE /api/patients/:id/vitals - Delete vitals entry for date
router.delete("/:id/vitals", async (req, res) => {
  try {
    const patId = req.params.id;
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "Date parameter is required" });

    const [patientRows] = await pool.query(
      "SELECT CODE_BARRE, CODE_MALADE FROM malade WHERE CODE_BARRE = ? OR CODE_MALADE = ?",
      [patId, patId]
    );

    if (patientRows.length === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const patientIds = Array.from(new Set([patientRows[0].CODE_BARRE, patientRows[0].CODE_MALADE].filter(Boolean)));

    await pool.query("DELETE FROM hta_malade WHERE ID_MALADE IN (?) AND DATE_HTA = ?", [patientIds, date]);
    await pool.query("DELETE FROM spo2_malade WHERE ID_MALADE IN (?) AND DATE_PRISE = ?", [patientIds, date]);
    await pool.query("DELETE FROM bg_malade WHERE ID_MALADE IN (?) AND DATE_PRISE = ?", [patientIds, date]);

    res.json({ success: true, message: "Vitals deleted for date." });
  } catch (err) {
    console.error("API DELETE /api/patients/:id/vitals Error:", err);
    res.status(500).json({ error: "Failed to delete vitals" });
  }
});

// GET /api/patients/:id/observations - List all observations for a patient
router.get("/:id/observations", async (req, res) => {
  try {
    const patId = req.params.id;
    const [patRows] = await pool.query(
      "SELECT CODE_BARRE, CODE_MALADE FROM malade WHERE CODE_BARRE = ? OR CODE_MALADE = ?",
      [patId, patId]
    );

    const ids = [];
    if (patRows.length > 0) {
      if (patRows[0].CODE_BARRE) ids.push(patRows[0].CODE_BARRE);
      if (patRows[0].CODE_MALADE) ids.push(patRows[0].CODE_MALADE);
    }
    if (ids.length === 0) ids.push(patId);

    const [rows] = await pool.query(
      `SELECT ID as id, ID_MALADE as patientId, DATE_FORMAT(DATE_OBS, '%Y-%m-%d') as date, OBS as observation
       FROM obs_malade
       WHERE ID_MALADE IN (?)
       ORDER BY DATE_OBS DESC, ID DESC`,
      [ids]
    );

    res.json(rows);
  } catch (err) {
    console.error("API GET /api/patients/:id/observations Error:", err);
    res.status(500).json({ error: "Failed to fetch patient observations" });
  }
});

// POST /api/patients/:id/observations - Add/Update observation row for today
router.post("/:id/observations", async (req, res) => {
  try {
    const patId = req.params.id;
    const { observation, date } = req.body;
    if (!observation || !observation.trim()) {
      return res.status(400).json({ error: "Observation text is required" });
    }

    const obsDate = date || new Date().toISOString().split("T")[0];

    const [patRows] = await pool.query(
      "SELECT CODE_BARRE, CODE_MALADE FROM malade WHERE CODE_BARRE = ? OR CODE_MALADE = ?",
      [patId, patId]
    );

    const ids = [];
    if (patRows.length > 0) {
      if (patRows[0].CODE_BARRE) ids.push(patRows[0].CODE_BARRE);
      if (patRows[0].CODE_MALADE) ids.push(patRows[0].CODE_MALADE);
    }
    if (ids.length === 0) ids.push(patId);
    const patientIdForInsert = ids[0];

    await pool.query("DELETE FROM obs_malade WHERE ID_MALADE IN (?) AND DATE_OBS = ?", [ids, obsDate]);

    const [cols] = await pool.query("SHOW COLUMNS FROM obs_malade");
    const idCol = cols.find(c => c.Field === 'ID');
    const isAuto = idCol && idCol.Extra.includes('auto_increment');

    let sql, params;
    if (isAuto) {
      sql = "INSERT INTO obs_malade (ID_MALADE, DATE_OBS, OBS) VALUES (?, ?, ?)";
      params = [patientIdForInsert, obsDate, observation.trim()];
    } else {
      sql = "INSERT INTO obs_malade (ID, ID_MALADE, DATE_OBS, OBS) VALUES ((SELECT COALESCE(MAX(t.ID), 0) + 1 FROM obs_malade t), ?, ?, ?)";
      params = [patientIdForInsert, obsDate, observation.trim()];
    }

    const [result] = await pool.query(sql, params);
    const newId = isAuto ? result.insertId : null;

    res.status(201).json({
      success: true,
      id: newId,
      patientId: patientIdForInsert,
      date: obsDate,
      observation: observation.trim()
    });
  } catch (err) {
    console.error("API POST /api/patients/:id/observations Error:", err);
    res.status(500).json({ error: "Failed to save observation" });
  }
});

// DELETE /api/patients/observations/:obsId - Delete an observation row by ID
router.delete("/observations/:obsId", async (req, res) => {
  try {
    const obsId = req.params.obsId;
    await pool.query("DELETE FROM obs_malade WHERE ID = ?", [obsId]);
    res.json({ success: true, deletedId: obsId });
  } catch (err) {
    console.error("API DELETE /api/patients/observations/:obsId Error:", err);
    res.status(500).json({ error: "Failed to delete observation" });
  }
});

// GET /api/patients/:id/height - List height history for a patient
router.get("/:id/height", async (req, res) => {
  try {
    const patId = req.params.id;
    const [patRows] = await pool.query(
      "SELECT CODE_BARRE, CODE_MALADE FROM malade WHERE CODE_BARRE = ? OR CODE_MALADE = ?",
      [patId, patId]
    );

    const ids = [];
    if (patRows.length > 0) {
      if (patRows[0].CODE_BARRE) ids.push(patRows[0].CODE_BARRE);
      if (patRows[0].CODE_MALADE) ids.push(patRows[0].CODE_MALADE);
    }
    if (ids.length === 0) ids.push(patId);

    let rows = [];
    try {
      [rows] = await pool.query(
        `SELECT ID as id, ID_MALADE as patientId, DATE_FORMAT(DATE_TAILLE, '%Y-%m-%d') as date, TAILLE as height
         FROM malade_info_taille
         WHERE ID_MALADE IN (?)
         ORDER BY DATE_TAILLE DESC, ID DESC`,
        [ids]
      );
    } catch (e1) {
      try {
        [rows] = await pool.query(
          `SELECT ID as id, ID_MALADE as patientId, DATE_FORMAT(DATE_PRISE, '%Y-%m-%d') as date, TAILLE as height
           FROM malade_info_taille
           WHERE ID_MALADE IN (?)
           ORDER BY DATE_PRISE DESC, ID DESC`,
          [ids]
        );
      } catch (e2) {
        [rows] = await pool.query(
          `SELECT ID as id, ID_MALADE as patientId, '' as date, TAILLE as height
           FROM malade_info_taille
           WHERE ID_MALADE IN (?)
           ORDER BY ID DESC`,
          [ids]
        );
      }
    }

    res.json(rows);
  } catch (err) {
    console.error("API GET /api/patients/:id/height Error:", err);
    res.status(500).json({ error: "Failed to fetch patient height records" });
  }
});

// POST /api/patients/:id/height - Add/Update height record for today
router.post("/:id/height", async (req, res) => {
  try {
    const patId = req.params.id;
    const { height, date } = req.body;
    if (!height) {
      return res.status(400).json({ error: "Height value is required" });
    }

    const recordDate = date || new Date().toISOString().split("T")[0];

    const [patRows] = await pool.query(
      "SELECT CODE_BARRE, CODE_MALADE FROM malade WHERE CODE_BARRE = ? OR CODE_MALADE = ?",
      [patId, patId]
    );

    const ids = [];
    if (patRows.length > 0) {
      if (patRows[0].CODE_BARRE) ids.push(patRows[0].CODE_BARRE);
      if (patRows[0].CODE_MALADE) ids.push(patRows[0].CODE_MALADE);
    }
    if (ids.length === 0) ids.push(patId);
    const patientIdForInsert = ids[0];

    let cols = [];
    try {
      const [c] = await pool.query("SHOW COLUMNS FROM malade_info_taille");
      cols = c;
    } catch (e) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS malade_info_taille (
          ID INT AUTO_INCREMENT PRIMARY KEY,
          ID_MALADE VARCHAR(50),
          DATE_TAILLE DATE,
          TAILLE VARCHAR(50)
        )
      `);
      const [c] = await pool.query("SHOW COLUMNS FROM malade_info_taille");
      cols = c;
    }

    const hasDateTaille = cols.some(c => c.Field === 'DATE_TAILLE');
    const hasDatePrise = cols.some(c => c.Field === 'DATE_PRISE');
    const idCol = cols.find(c => c.Field === 'ID');
    const isAuto = idCol && idCol.Extra.includes('auto_increment');

    const dateField = hasDateTaille ? 'DATE_TAILLE' : (hasDatePrise ? 'DATE_PRISE' : null);

    if (dateField) {
      await pool.query(`DELETE FROM malade_info_taille WHERE ID_MALADE IN (?) AND ${dateField} = ?`, [ids, recordDate]);
    }

    let sql, params;
    if (dateField) {
      if (isAuto) {
        sql = `INSERT INTO malade_info_taille (ID_MALADE, ${dateField}, TAILLE) VALUES (?, ?, ?)`;
        params = [patientIdForInsert, recordDate, height];
      } else {
        sql = `INSERT INTO malade_info_taille (ID, ID_MALADE, ${dateField}, TAILLE) VALUES ((SELECT COALESCE(MAX(t.ID), 0) + 1 FROM malade_info_taille t), ?, ?, ?)`;
        params = [patientIdForInsert, recordDate, height];
      }
    } else {
      if (isAuto) {
        sql = "INSERT INTO malade_info_taille (ID_MALADE, TAILLE) VALUES (?, ?)";
        params = [patientIdForInsert, height];
      } else {
        sql = "INSERT INTO malade_info_taille (ID, ID_MALADE, TAILLE) VALUES ((SELECT COALESCE(MAX(t.ID), 0) + 1 FROM malade_info_taille t), ?, ?)";
        params = [patientIdForInsert, height];
      }
    }

    const [result] = await pool.query(sql, params);
    res.status(201).json({
      success: true,
      id: isAuto ? result.insertId : null,
      patientId: patientIdForInsert,
      date: recordDate,
      height
    });
  } catch (err) {
    console.error("API POST /api/patients/:id/height Error:", err);
    res.status(500).json({ error: "Failed to add height record" });
  }
});

// DELETE /api/patients/height/:heightId - Delete a height record
router.delete("/height/:heightId", async (req, res) => {
  try {
    const heightId = req.params.heightId;
    await pool.query("DELETE FROM malade_info_taille WHERE ID = ?", [heightId]);
    res.json({ success: true, deletedId: heightId });
  } catch (err) {
    console.error("API DELETE /api/patients/height/:heightId Error:", err);
    res.status(500).json({ error: "Failed to delete height record" });
  }
});

// GET /api/patients/:id/weight - List weight history for a patient
router.get("/:id/weight", async (req, res) => {
  try {
    const patId = req.params.id;
    const [patRows] = await pool.query(
      "SELECT CODE_BARRE, CODE_MALADE FROM malade WHERE CODE_BARRE = ? OR CODE_MALADE = ?",
      [patId, patId]
    );

    const ids = [];
    if (patRows.length > 0) {
      if (patRows[0].CODE_BARRE) ids.push(patRows[0].CODE_BARRE);
      if (patRows[0].CODE_MALADE) ids.push(patRows[0].CODE_MALADE);
    }
    if (ids.length === 0) ids.push(patId);

    let rows = [];
    try {
      [rows] = await pool.query(
        `SELECT ID as id, ID_MALADE as patientId, DATE_FORMAT(DATE_POIDS, '%Y-%m-%d') as date, POIDS as weight
         FROM malade_info_poids
         WHERE ID_MALADE IN (?)
         ORDER BY DATE_POIDS DESC, ID DESC`,
        [ids]
      );
    } catch (e1) {
      try {
        [rows] = await pool.query(
          `SELECT ID as id, ID_MALADE as patientId, DATE_FORMAT(DATE_PRISE, '%Y-%m-%d') as date, POIDS as weight
           FROM malade_info_poids
           WHERE ID_MALADE IN (?)
           ORDER BY DATE_PRISE DESC, ID DESC`,
          [ids]
        );
      } catch (e2) {
        [rows] = await pool.query(
          `SELECT ID as id, ID_MALADE as patientId, '' as date, POIDS as weight
           FROM malade_info_poids
           WHERE ID_MALADE IN (?)
           ORDER BY ID DESC`,
          [ids]
        );
      }
    }

    res.json(rows);
  } catch (err) {
    console.error("API GET /api/patients/:id/weight Error:", err);
    res.status(500).json({ error: "Failed to fetch patient weight records" });
  }
});

// POST /api/patients/:id/weight - Add/Update weight record for today
router.post("/:id/weight", async (req, res) => {
  try {
    const patId = req.params.id;
    const { weight, date } = req.body;
    if (!weight) {
      return res.status(400).json({ error: "Weight value is required" });
    }

    const recordDate = date || new Date().toISOString().split("T")[0];

    const [patRows] = await pool.query(
      "SELECT CODE_BARRE, CODE_MALADE FROM malade WHERE CODE_BARRE = ? OR CODE_MALADE = ?",
      [patId, patId]
    );

    const ids = [];
    if (patRows.length > 0) {
      if (patRows[0].CODE_BARRE) ids.push(patRows[0].CODE_BARRE);
      if (patRows[0].CODE_MALADE) ids.push(patRows[0].CODE_MALADE);
    }
    if (ids.length === 0) ids.push(patId);
    const patientIdForInsert = ids[0];

    let cols = [];
    try {
      const [c] = await pool.query("SHOW COLUMNS FROM malade_info_poids");
      cols = c;
    } catch (e) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS malade_info_poids (
          ID INT AUTO_INCREMENT PRIMARY KEY,
          ID_MALADE VARCHAR(50),
          DATE_POIDS DATE,
          POIDS VARCHAR(50)
        )
      `);
      const [c] = await pool.query("SHOW COLUMNS FROM malade_info_poids");
      cols = c;
    }

    const hasDatePoids = cols.some(c => c.Field === 'DATE_POIDS');
    const hasDatePrise = cols.some(c => c.Field === 'DATE_PRISE');
    const idCol = cols.find(c => c.Field === 'ID');
    const isAuto = idCol && idCol.Extra.includes('auto_increment');

    const dateField = hasDatePoids ? 'DATE_POIDS' : (hasDatePrise ? 'DATE_PRISE' : null);

    if (dateField) {
      await pool.query(`DELETE FROM malade_info_poids WHERE ID_MALADE IN (?) AND ${dateField} = ?`, [ids, recordDate]);
    }

    let sql, params;
    if (dateField) {
      if (isAuto) {
        sql = `INSERT INTO malade_info_poids (ID_MALADE, ${dateField}, POIDS) VALUES (?, ?, ?)`;
        params = [patientIdForInsert, recordDate, weight];
      } else {
        sql = `INSERT INTO malade_info_poids (ID, ID_MALADE, ${dateField}, POIDS) VALUES ((SELECT COALESCE(MAX(t.ID), 0) + 1 FROM malade_info_poids t), ?, ?, ?)`;
        params = [patientIdForInsert, recordDate, weight];
      }
    } else {
      if (isAuto) {
        sql = "INSERT INTO malade_info_poids (ID_MALADE, POIDS) VALUES (?, ?)";
        params = [patientIdForInsert, weight];
      } else {
        sql = "INSERT INTO malade_info_poids (ID, ID_MALADE, POIDS) VALUES ((SELECT COALESCE(MAX(t.ID), 0) + 1 FROM malade_info_poids t), ?, ?)";
        params = [patientIdForInsert, weight];
      }
    }

    const [result] = await pool.query(sql, params);
    res.status(201).json({
      success: true,
      id: isAuto ? result.insertId : null,
      patientId: patientIdForInsert,
      date: recordDate,
      weight
    });
  } catch (err) {
    console.error("API POST /api/patients/:id/weight Error:", err);
    res.status(500).json({ error: "Failed to add weight record" });
  }
});

// DELETE /api/patients/weight/:weightId - Delete a weight record
router.delete("/weight/:weightId", async (req, res) => {
  try {
    const weightId = req.params.weightId;
    await pool.query("DELETE FROM malade_info_poids WHERE ID = ?", [weightId]);
    res.json({ success: true, deletedId: weightId });
  } catch (err) {
    console.error("API DELETE /api/patients/weight/:weightId Error:", err);
    res.status(500).json({ error: "Failed to delete weight record" });
  }
});

// GET /api/patients/:id/head-circ - List head circumference history for a patient
router.get("/:id/head-circ", async (req, res) => {
  try {
    const patId = req.params.id;
    const [patRows] = await pool.query(
      "SELECT CODE_BARRE, CODE_MALADE FROM malade WHERE CODE_BARRE = ? OR CODE_MALADE = ?",
      [patId, patId]
    );

    const ids = [];
    if (patRows.length > 0) {
      if (patRows[0].CODE_BARRE) ids.push(patRows[0].CODE_BARRE);
      if (patRows[0].CODE_MALADE) ids.push(patRows[0].CODE_MALADE);
    }
    if (ids.length === 0) ids.push(patId);

    let rows = [];
    try {
      [rows] = await pool.query(
        `SELECT ID as id, ID_MALADE as patientId, DATE_FORMAT(DATE_PC, '%Y-%m-%d') as date, PC as headCirc
         FROM malade_info_pc
         WHERE ID_MALADE IN (?)
         ORDER BY DATE_PC DESC, ID DESC`,
        [ids]
      );
    } catch (e1) {
      try {
        [rows] = await pool.query(
          `SELECT ID as id, ID_MALADE as patientId, DATE_FORMAT(DATE_PRISE, '%Y-%m-%d') as date, PC as headCirc
           FROM malade_info_pc
           WHERE ID_MALADE IN (?)
           ORDER BY DATE_PRISE DESC, ID DESC`,
          [ids]
        );
      } catch (e2) {
        [rows] = await pool.query(
          `SELECT ID as id, ID_MALADE as patientId, '' as date, PC as headCirc
           FROM malade_info_pc
           WHERE ID_MALADE IN (?)
           ORDER BY ID DESC`,
          [ids]
        );
      }
    }

    res.json(rows);
  } catch (err) {
    console.error("API GET /api/patients/:id/head-circ Error:", err);
    res.status(500).json({ error: "Failed to fetch patient head circumference records" });
  }
});

// POST /api/patients/:id/head-circ - Add/Update head circumference record for today
router.post("/:id/head-circ", async (req, res) => {
  try {
    const patId = req.params.id;
    const { headCirc, date } = req.body;
    if (!headCirc) {
      return res.status(400).json({ error: "Head circumference value is required" });
    }

    const recordDate = date || new Date().toISOString().split("T")[0];

    const [patRows] = await pool.query(
      "SELECT CODE_BARRE, CODE_MALADE FROM malade WHERE CODE_BARRE = ? OR CODE_MALADE = ?",
      [patId, patId]
    );

    const ids = [];
    if (patRows.length > 0) {
      if (patRows[0].CODE_BARRE) ids.push(patRows[0].CODE_BARRE);
      if (patRows[0].CODE_MALADE) ids.push(patRows[0].CODE_MALADE);
    }
    if (ids.length === 0) ids.push(patId);
    const patientIdForInsert = ids[0];

    let cols = [];
    try {
      const [c] = await pool.query("SHOW COLUMNS FROM malade_info_pc");
      cols = c;
    } catch (e) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS malade_info_pc (
          ID INT AUTO_INCREMENT PRIMARY KEY,
          ID_MALADE VARCHAR(50),
          DATE_PC DATE,
          PC VARCHAR(50)
        )
      `);
      const [c] = await pool.query("SHOW COLUMNS FROM malade_info_pc");
      cols = c;
    }

    const hasDatePc = cols.some(c => c.Field === 'DATE_PC');
    const hasDatePrise = cols.some(c => c.Field === 'DATE_PRISE');
    const idCol = cols.find(c => c.Field === 'ID');
    const isAuto = idCol && idCol.Extra.includes('auto_increment');

    const dateField = hasDatePc ? 'DATE_PC' : (hasDatePrise ? 'DATE_PRISE' : null);

    if (dateField) {
      await pool.query(`DELETE FROM malade_info_pc WHERE ID_MALADE IN (?) AND ${dateField} = ?`, [ids, recordDate]);
    }

    let sql, params;
    if (dateField) {
      if (isAuto) {
        sql = `INSERT INTO malade_info_pc (ID_MALADE, ${dateField}, PC) VALUES (?, ?, ?)`;
        params = [patientIdForInsert, recordDate, headCirc];
      } else {
        sql = `INSERT INTO malade_info_pc (ID, ID_MALADE, ${dateField}, PC) VALUES ((SELECT COALESCE(MAX(t.ID), 0) + 1 FROM malade_info_pc t), ?, ?, ?)`;
        params = [patientIdForInsert, recordDate, headCirc];
      }
    } else {
      if (isAuto) {
        sql = "INSERT INTO malade_info_pc (ID_MALADE, PC) VALUES (?, ?)";
        params = [patientIdForInsert, headCirc];
      } else {
        sql = "INSERT INTO malade_info_pc (ID, ID_MALADE, PC) VALUES ((SELECT COALESCE(MAX(t.ID), 0) + 1 FROM malade_info_pc t), ?, ?)";
        params = [patientIdForInsert, headCirc];
      }
    }

    const [result] = await pool.query(sql, params);
    res.status(201).json({
      success: true,
      id: isAuto ? result.insertId : null,
      patientId: patientIdForInsert,
      date: recordDate,
      headCirc
    });
  } catch (err) {
    console.error("API POST /api/patients/:id/head-circ Error:", err);
    res.status(500).json({ error: "Failed to add head circumference record" });
  }
});

// DELETE /api/patients/head-circ/:id - Delete a head circumference record
router.delete("/head-circ/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await pool.query("DELETE FROM malade_info_pc WHERE ID = ?", [id]);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    console.error("API DELETE /api/patients/head-circ/:id Error:", err);
    res.status(500).json({ error: "Failed to delete head circumference record" });
  }
});

export default router;
