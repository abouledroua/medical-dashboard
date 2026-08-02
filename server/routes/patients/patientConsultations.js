import express from "express";
import pool from "../../db.js";

const router = express.Router();

// GET /api/patients/:id/consultations - Basic consultations query
router.get("/:id/consultations", async (req, res) => {
  try {
    const patId = req.params.id;
    const [obsRows] = await pool.query(
      "SELECT ID as id, DATE_OBS as date, OBS as clinicalNotes FROM obs_malade WHERE ID_MALADE = ? ORDER BY ID DESC LIMIT 20",
      [patId],
    );

    const consultations = obsRows.map((o) => ({
      id: `c-${o.id}`,
      date: o.date
        ? new Date(o.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      time: "10:00 AM",
      doctor: "Dr. A. BENKERMI Ep. TATI",
      department: "ORL",
      chiefComplaint: "Medical Follow-up",
      diagnosis: o.clinicalNotes || "Observation",
      clinicalNotes: o.clinicalNotes || "Routine consultation completed.",
      prescriptions: [],
      vitalsAtVisit: "BP: 120/80 | HR: 72 | SpO2: 98%",
    }));

    res.json(consultations);
  } catch (err) {
    console.error("API consultations Error:", err);
    res.status(500).json({ error: "Failed to fetch consultations" });
  }
});

// POST /api/patients/:id/consultations - Add/Update observation note for today in obs_malade
router.post("/:id/consultations", async (req, res) => {
  try {
    const patId = req.params.id;
    const { chiefComplaint, diagnosis, clinicalNotes, date } = req.body;
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

    const [existingObs] = await pool.query(
      "SELECT ID FROM obs_malade WHERE ID_MALADE IN (?) AND DATE_OBS = ?",
      [ids, obsDate]
    );

    let newId = null;
    if (existingObs.length === 0) {
      const obsText = `${chiefComplaint || ""} - ${diagnosis || ""}: ${clinicalNotes || ""}`;
      const [cols] = await pool.query("SHOW COLUMNS FROM obs_malade");
      const idCol = cols.find(c => c.Field === 'ID');
      const isAuto = idCol && idCol.Extra.includes('auto_increment');

      let sql, params;
      if (isAuto) {
        sql = "INSERT INTO obs_malade (ID_MALADE, DATE_OBS, OBS) VALUES (?, ?, ?)";
        params = [patientIdForInsert, obsDate, obsText];
      } else {
        sql = "INSERT INTO obs_malade (ID, ID_MALADE, DATE_OBS, OBS) VALUES ((SELECT COALESCE(MAX(t.ID), 0) + 1 FROM obs_malade t), ?, ?, ?)";
        params = [patientIdForInsert, obsDate, obsText];
      }

      const [result] = await pool.query(sql, params);
      newId = isAuto ? result.insertId : null;
    } else {
      newId = existingObs[0].ID;
    }

    res.status(201).json({
      id: `c-${newId || Date.now()}`,
      date: obsDate,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      doctor: "Dr. A. BENKERMI Ep. TATI",
      department: "ORL",
      chiefComplaint: chiefComplaint || "Consultation",
      diagnosis: diagnosis || "Observation",
      clinicalNotes: clinicalNotes || "",
      prescriptions: [],
      vitalsAtVisit: "BP: 120/80 | HR: 72",
    });
  } catch (err) {
    console.error("API POST consultation Error:", err);
    res.status(500).json({ error: "Failed to add consultation note" });
  }
});

// --- NUTRITION / ALIMENTATION ENDPOINTS ---
// GET /api/patients/:id/nutrition - List nutrition history for a patient from alimentation_malade
router.get("/:id/nutrition", async (req, res) => {
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
      `SELECT am.ID_ALIMENTATION as id,
              am.ID_MALADE as patientId,
              DATE_FORMAT(am.DATE_PRISE, '%Y-%m-%d') as date,
              a.DESIGNATION as nutrition
       FROM alimentation_malade am
       JOIN alimentation a ON am.ID_ALIMENTATION = a.ID_ALIMENTATION
       WHERE am.ID_MALADE IN (?)
       ORDER BY am.DATE_PRISE DESC, am.ID_ALIMENTATION DESC`,
      [ids]
    );

    res.json(rows);
  } catch (err) {
    console.error("API GET /api/patients/:id/nutrition Error:", err);
    res.status(500).json({ error: "Failed to fetch patient nutrition records" });
  }
});

// POST /api/patients/:id/nutrition - Add/Update single nutrition record for today in alimentation & alimentation_malade
router.post("/:id/nutrition", async (req, res) => {
  try {
    const patId = req.params.id;
    const { nutrition, date } = req.body;
    if (!nutrition || !nutrition.trim()) {
      return res.status(400).json({ error: "Nutrition value is required" });
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

    const trimmedNutr = nutrition.trim();

    let idAlimentation = null;
    const [existingAlim] = await pool.query(
      "SELECT ID_ALIMENTATION FROM alimentation WHERE DESIGNATION = ?",
      [trimmedNutr]
    );

    if (existingAlim.length > 0) {
      idAlimentation = existingAlim[0].ID_ALIMENTATION;
    } else {
      const [maxAlim] = await pool.query("SELECT COALESCE(MAX(ID_ALIMENTATION), 0) + 1 as nextId FROM alimentation");
      idAlimentation = maxAlim[0].nextId;
      await pool.query(
        "INSERT INTO alimentation (ID_ALIMENTATION, DESIGNATION) VALUES (?, ?)",
        [idAlimentation, trimmedNutr]
      );
    }

    await pool.query(
      "DELETE FROM alimentation_malade WHERE ID_MALADE IN (?) AND DATE_PRISE = ?",
      [ids, recordDate]
    );

    await pool.query(
      "INSERT INTO alimentation_malade (ID_ALIMENTATION, ID_MALADE, DATE_PRISE) VALUES (?, ?, ?)",
      [idAlimentation, patientIdForInsert, recordDate]
    );

    res.status(201).json({
      success: true,
      id: idAlimentation,
      patientId: patientIdForInsert,
      date: recordDate,
      nutrition: trimmedNutr
    });
  } catch (err) {
    console.error("API POST /api/patients/:id/nutrition Error:", err);
    res.status(500).json({ error: "Failed to add nutrition record" });
  }
});

// DELETE /api/patients/nutrition/:id - Delete a nutrition record from alimentation_malade
router.delete("/nutrition/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await pool.query("DELETE FROM alimentation_malade WHERE ID_ALIMENTATION = ?", [id]);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    console.error("API DELETE /api/patients/nutrition/:id Error:", err);
    res.status(500).json({ error: "Failed to delete nutrition record" });
  }
});

// --- CONSULT. DIAGNOSIS ENDPOINTS ---
// GET /api/patients/:id/diag-consult - List consult diagnosis history for a patient from diag_malade
router.get("/:id/diag-consult", async (req, res) => {
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
      `SELECT dm.ID_DIAG as id,
              dm.ID_MALADE as patientId,
              DATE_FORMAT(dm.DATE_PRISE, '%Y-%m-%d') as date,
              d.DESIGNATION as diagnosis
       FROM diag_malade dm
       JOIN diagnostique d ON dm.ID_DIAG = d.ID_DIAG
       WHERE dm.ID_MALADE IN (?)
       ORDER BY dm.DATE_PRISE DESC, dm.ID_DIAG DESC`,
      [ids]
    );

    res.json(rows);
  } catch (err) {
    console.error("API GET /api/patients/:id/diag-consult Error:", err);
    res.status(500).json({ error: "Failed to fetch patient consult diagnosis records" });
  }
});

// POST /api/patients/:id/diag-consult - Add/Update single consult diagnosis record for today in diagnostique & diag_malade
router.post("/:id/diag-consult", async (req, res) => {
  try {
    const patId = req.params.id;
    const { diagnosis, date } = req.body;
    if (!diagnosis || !diagnosis.trim()) {
      return res.status(400).json({ error: "Diagnosis value is required" });
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

    const trimmedDiag = diagnosis.trim();

    let idDiag = null;
    const [existingDiag] = await pool.query(
      "SELECT ID_DIAG FROM diagnostique WHERE DESIGNATION = ?",
      [trimmedDiag]
    );

    if (existingDiag.length > 0) {
      idDiag = existingDiag[0].ID_DIAG;
    } else {
      const [maxDiag] = await pool.query("SELECT COALESCE(MAX(ID_DIAG), 0) + 1 as nextId FROM diagnostique");
      idDiag = maxDiag[0].nextId;
      await pool.query(
        "INSERT INTO diagnostique (ID_DIAG, DESIGNATION) VALUES (?, ?)",
        [idDiag, trimmedDiag]
      );
    }

    await pool.query(
      "DELETE FROM diag_malade WHERE ID_MALADE IN (?) AND DATE_PRISE = ?",
      [ids, recordDate]
    );

    await pool.query(
      "INSERT INTO diag_malade (ID_DIAG, ID_MALADE, DATE_PRISE) VALUES (?, ?, ?)",
      [idDiag, patientIdForInsert, recordDate]
    );

    res.status(201).json({
      success: true,
      id: idDiag,
      patientId: patientIdForInsert,
      date: recordDate,
      diagnosis: trimmedDiag
    });
  } catch (err) {
    console.error("API POST /api/patients/:id/diag-consult Error:", err);
    res.status(500).json({ error: "Failed to add consult diagnosis record" });
  }
});

// DELETE /api/patients/diag-consult/:id - Delete a consult diagnosis record from diag_malade
router.delete("/diag-consult/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await pool.query("DELETE FROM diag_malade WHERE ID_DIAG = ?", [id]);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    console.error("API DELETE /api/patients/diag-consult/:id Error:", err);
    res.status(500).json({ error: "Failed to delete consult diagnosis record" });
  }
});

// --- DDR & DPA (OBSTETRICS) ENDPOINTS ---
// GET /api/patients/:id/ddr-dpa - List DDR & DPA history for a patient from ddr_malade
router.get("/:id/ddr-dpa", async (req, res) => {
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
      `SELECT ID_DDR as id,
              ID_MALADE as patientId,
              DATE_PRISE as datePrise,
              DDR as ddrVal,
              DPA as dpaVal
       FROM ddr_malade
       WHERE ID_MALADE IN (?)
       ORDER BY DATE_PRISE DESC, ID_DDR DESC`,
      [ids]
    );

    const formatDashDate = (val) => {
      if (!val) return '';
      const str = String(val).trim();
      if (str.length === 8) {
        return `${str.slice(0,4)}-${str.slice(4,6)}-${str.slice(6,8)}`;
      }
      if (str.includes('T')) return str.split('T')[0];
      return str;
    };

    const formatted = rows.map(r => ({
      id: r.id,
      patientId: r.patientId,
      date: formatDashDate(r.datePrise),
      ddr: formatDashDate(r.ddrVal),
      dpa: formatDashDate(r.dpaVal)
    }));

    res.json(formatted);
  } catch (err) {
    console.error("API GET /api/patients/:id/ddr-dpa Error:", err);
    res.status(500).json({ error: "Failed to fetch patient DDR & DPA records" });
  }
});

// POST /api/patients/:id/ddr-dpa - Add/Update DDR & DPA record for today in ddr_malade
router.post("/:id/ddr-dpa", async (req, res) => {
  try {
    const patId = req.params.id;
    const { ddr, dpa, date } = req.body;

    const recordDateStr = date || new Date().toISOString().split("T")[0];

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

    const toYYYYMMDD = (dStr) => dStr ? parseInt(dStr.replace(/-/g, ''), 10) : 0;

    const datePriseInt = toYYYYMMDD(recordDateStr);
    const ddrInt = toYYYYMMDD(ddr);
    const dpaInt = toYYYYMMDD(dpa);

    await pool.query(
      "DELETE FROM ddr_malade WHERE ID_MALADE IN (?) AND DATE_PRISE = ?",
      [ids, datePriseInt]
    );

    const [maxRows] = await pool.query("SELECT COALESCE(MAX(ID_DDR), 0) + 1 as nextId FROM ddr_malade");
    const nextId = maxRows[0].nextId;

    await pool.query(
      "INSERT INTO ddr_malade (ID_DDR, ID_MALADE, DATE_PRISE, DDR, DPA) VALUES (?, ?, ?, ?, ?)",
      [nextId, patientIdForInsert, datePriseInt, ddrInt, dpaInt]
    );

    res.status(201).json({
      success: true,
      id: nextId,
      patientId: patientIdForInsert,
      date: recordDateStr,
      ddr: ddr || '',
      dpa: dpa || ''
    });
  } catch (err) {
    console.error("API POST /api/patients/:id/ddr-dpa Error:", err);
    res.status(500).json({ error: "Failed to add DDR & DPA record" });
  }
});

// DELETE /api/patients/ddr-dpa/:id - Delete a DDR & DPA record
router.delete("/ddr-dpa/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await pool.query("DELETE FROM ddr_malade WHERE ID_DDR = ?", [id]);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    console.error("API DELETE /api/patients/ddr-dpa/:id Error:", err);
    res.status(500).json({ error: "Failed to delete DDR & DPA record" });
  }
});

// GET /api/patients/:id/general-diagnosis - Get general diagnosis from malade.DIAGNOSTIQUE
router.get("/:id/general-diagnosis", async (req, res) => {
  try {
    const patId = req.params.id;
    const [rows] = await pool.query(
      "SELECT DIAGNOSTIQUE FROM malade WHERE CODE_BARRE = ? OR CODE_MALADE = ?",
      [patId, patId]
    );
    res.json({
      generalDiagnosis: rows.length > 0 && rows[0].DIAGNOSTIQUE ? rows[0].DIAGNOSTIQUE : ""
    });
  } catch (err) {
    console.error("API GET /api/patients/:id/general-diagnosis Error:", err);
    res.status(500).json({ error: "Failed to fetch general diagnosis" });
  }
});

// POST /api/patients/:id/general-diagnosis - Update malade.DIAGNOSTIQUE
router.post("/:id/general-diagnosis", async (req, res) => {
  try {
    const patId = req.params.id;
    const { generalDiagnosis } = req.body;
    const diagText = generalDiagnosis !== undefined ? String(generalDiagnosis).trim() : "";

    await pool.query(
      "UPDATE malade SET DIAGNOSTIQUE = ? WHERE CODE_BARRE = ? OR CODE_MALADE = ?",
      [diagText, patId, patId]
    );

    res.json({
      success: true,
      generalDiagnosis: diagText
    });
  } catch (err) {
    console.error("API POST /api/patients/:id/general-diagnosis Error:", err);
    res.status(500).json({ error: "Failed to update general diagnosis" });
  }
});

export default router;
