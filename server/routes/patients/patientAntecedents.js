import express from "express";
import pool from "../../db.js";

const router = express.Router();

// GET /api/patients/antecedents/personal - Fetch list of personal antecedents from 'antecedent' table
router.get("/antecedents/personal", async (req, res) => {
  try {
    const q = req.query.q ? `%${req.query.q.trim()}%` : "%";
    const [rows] = await pool.query(
      "SELECT DISTINCT DESIGNATION FROM antecedent WHERE DESIGNATION IS NOT NULL AND TRIM(DESIGNATION) != '' AND DESIGNATION LIKE ? ORDER BY DESIGNATION ASC LIMIT 50",
      [q]
    );
    res.json(rows.map(r => r.DESIGNATION.trim()).filter(Boolean));
  } catch (err) {
    console.error("API GET /api/patients/antecedents/personal Error:", err);
    res.status(500).json({ error: "Failed to fetch personal antecedents" });
  }
});

// GET /api/patients/antecedents/family - Fetch list of family antecedents from 'antecedent_fam' table
router.get("/antecedents/family", async (req, res) => {
  try {
    const q = req.query.q ? `%${req.query.q.trim()}%` : "%";
    const [rows] = await pool.query(
      "SELECT DISTINCT DESIGNATION FROM antecedent_fam WHERE DESIGNATION IS NOT NULL AND TRIM(DESIGNATION) != '' AND DESIGNATION LIKE ? ORDER BY DESIGNATION ASC LIMIT 50",
      [q]
    );
    res.json(rows.map(r => r.DESIGNATION.trim()).filter(Boolean));
  } catch (err) {
    console.error("API GET /api/patients/antecedents/family Error:", err);
    res.status(500).json({ error: "Failed to fetch family antecedents" });
  }
});

// GET /api/patients/allergies/suggestions - Fetch list of allergies from 'allergie' table
router.get("/allergies/suggestions", async (req, res) => {
  try {
    const q = req.query.q ? `%${req.query.q.trim()}%` : "%";
    const [rows] = await pool.query(
      "SELECT DISTINCT DESIGNATION FROM allergie WHERE DESIGNATION IS NOT NULL AND TRIM(DESIGNATION) != '' AND DESIGNATION LIKE ? ORDER BY DESIGNATION ASC LIMIT 50",
      [q]
    );
    res.json(rows.map(r => r.DESIGNATION.trim()).filter(Boolean));
  } catch (err) {
    console.error("API GET /api/patients/allergies/suggestions Error:", err);
    res.status(500).json({ error: "Failed to fetch allergies suggestions" });
  }
});

// --- FAMILY ANTECEDENTS FOR PATIENT ENDPOINTS ---
// GET /api/patients/:id/family-antecedents - List family antecedents for a patient
router.get("/:id/family-antecedents", async (req, res) => {
  try {
    const patId = req.params.id;
    const [patRows] = await pool.query(
      "SELECT CODE_BARRE, CODE_MALADE FROM malade WHERE CODE_BARRE = ? OR CODE_MALADE = ?",
      [patId, patId]
    );
    if (patRows.length === 0) return res.json([]);

    const cb = patRows[0].CODE_BARRE;
    const cm = patRows[0].CODE_MALADE;

    const [rows] = await pool.query(
      `SELECT f.ID_ANTECEDENT as id, f.DESIGNATION as designation
       FROM antecedent_malade_fam amf
       JOIN antecedent_fam f ON amf.ID_ANTECEDENT = f.ID_ANTECEDENT
       WHERE amf.ID_MALADE = ? OR amf.ID_MALADE = ?`,
      [cb, cm]
    );
    res.json(rows.map(r => (r.designation ? r.designation.trim() : '')).filter(Boolean));
  } catch (err) {
    console.error("API GET /api/patients/:id/family-antecedents Error:", err);
    res.status(500).json({ error: "Failed to fetch family antecedents" });
  }
});

// POST /api/patients/:id/family-antecedents - Sync family antecedents list for a patient
router.post("/:id/family-antecedents", async (req, res) => {
  try {
    const patId = req.params.id;
    const { antecedents, designation } = req.body;
    const items = Array.isArray(antecedents)
      ? antecedents
      : designation
        ? [designation]
        : [];

    const [patRows] = await pool.query(
      "SELECT CODE_BARRE, CODE_MALADE FROM malade WHERE CODE_BARRE = ? OR CODE_MALADE = ?",
      [patId, patId]
    );
    if (patRows.length === 0) return res.status(404).json({ error: "Patient not found" });

    const patientIdForInsert = patRows[0].CODE_BARRE || patRows[0].CODE_MALADE;
    const ids = Array.from(new Set([patRows[0].CODE_BARRE, patRows[0].CODE_MALADE].filter(Boolean)));

    // Clear existing patient family antecedents
    await pool.query("DELETE FROM antecedent_malade_fam WHERE ID_MALADE IN (?)", [ids]);

    for (const rawItem of items) {
      const item = String(rawItem).trim();
      if (!item) continue;

      let idAnt = null;
      const [existing] = await pool.query(
        "SELECT ID_ANTECEDENT FROM antecedent_fam WHERE DESIGNATION = ?",
        [item]
      );

      if (existing.length > 0) {
        idAnt = existing[0].ID_ANTECEDENT;
      } else {
        const [maxRow] = await pool.query("SELECT COALESCE(MAX(ID_ANTECEDENT), 0) + 1 as nextId FROM antecedent_fam");
        idAnt = maxRow[0].nextId;
        await pool.query(
          "INSERT INTO antecedent_fam (ID_ANTECEDENT, DESIGNATION) VALUES (?, ?)",
          [idAnt, item]
        );
      }

      await pool.query(
        "INSERT IGNORE INTO antecedent_malade_fam (ID_ANTECEDENT, ID_MALADE) VALUES (?, ?)",
        [idAnt, patientIdForInsert]
      );
    }

    res.json({ success: true, count: items.length });
  } catch (err) {
    console.error("API POST /api/patients/:id/family-antecedents Error:", err);
    res.status(500).json({ error: "Failed to save family antecedents" });
  }
});

// --- PERSONAL ANTECEDENTS FOR PATIENT ENDPOINTS ---
// GET /api/patients/:id/personal-antecedents - List personal antecedents for a patient
router.get("/:id/personal-antecedents", async (req, res) => {
  try {
    const patId = req.params.id;
    const [patRows] = await pool.query(
      "SELECT CODE_BARRE, CODE_MALADE FROM malade WHERE CODE_BARRE = ? OR CODE_MALADE = ?",
      [patId, patId]
    );
    if (patRows.length === 0) return res.json([]);

    const cb = patRows[0].CODE_BARRE;
    const cm = patRows[0].CODE_MALADE;

    const [rows] = await pool.query(
      `SELECT a.ID_ANTECEDENT as id, a.DESIGNATION as designation
       FROM antecedent_malade am
       JOIN antecedent a ON am.ID_ANTECEDENT = a.ID_ANTECEDENT
       WHERE am.ID_MALADE = ? OR am.ID_MALADE = ?`,
      [cb, cm]
    );
    res.json(rows.map(r => (r.designation ? r.designation.trim() : '')).filter(Boolean));
  } catch (err) {
    console.error("API GET /api/patients/:id/personal-antecedents Error:", err);
    res.status(500).json({ error: "Failed to fetch personal antecedents" });
  }
});

// POST /api/patients/:id/personal-antecedents - Sync personal antecedents list for a patient
router.post("/:id/personal-antecedents", async (req, res) => {
  try {
    const patId = req.params.id;
    const { antecedents, designation } = req.body;
    const items = Array.isArray(antecedents)
      ? antecedents
      : designation
        ? [designation]
        : [];

    const [patRows] = await pool.query(
      "SELECT CODE_BARRE, CODE_MALADE FROM malade WHERE CODE_BARRE = ? OR CODE_MALADE = ?",
      [patId, patId]
    );
    if (patRows.length === 0) return res.status(404).json({ error: "Patient not found" });

    const patientIdForInsert = patRows[0].CODE_BARRE || patRows[0].CODE_MALADE;
    const ids = Array.from(new Set([patRows[0].CODE_BARRE, patRows[0].CODE_MALADE].filter(Boolean)));

    // Clear existing patient personal antecedents
    await pool.query("DELETE FROM antecedent_malade WHERE ID_MALADE IN (?)", [ids]);

    for (const rawItem of items) {
      const item = String(rawItem).trim();
      if (!item) continue;

      let idAnt = null;
      const [existing] = await pool.query(
        "SELECT ID_ANTECEDENT FROM antecedent WHERE DESIGNATION = ?",
        [item]
      );

      if (existing.length > 0) {
        idAnt = existing[0].ID_ANTECEDENT;
      } else {
        const [maxRow] = await pool.query("SELECT COALESCE(MAX(ID_ANTECEDENT), 0) + 1 as nextId FROM antecedent");
        idAnt = maxRow[0].nextId;
        await pool.query(
          "INSERT INTO antecedent (ID_ANTECEDENT, DESIGNATION) VALUES (?, ?)",
          [idAnt, item]
        );
      }

      await pool.query(
        "INSERT IGNORE INTO antecedent_malade (ID_ANTECEDENT, ID_MALADE) VALUES (?, ?)",
        [idAnt, patientIdForInsert]
      );
    }

    res.json({ success: true, count: items.length });
  } catch (err) {
    console.error("API POST /api/patients/:id/personal-antecedents Error:", err);
    res.status(500).json({ error: "Failed to save personal antecedents" });
  }
});

// --- ALLERGIES FOR PATIENT ENDPOINTS ---
// GET /api/patients/:id/allergies - List allergies for a patient
router.get("/:id/allergies", async (req, res) => {
  try {
    const patId = req.params.id;
    const [patRows] = await pool.query(
      "SELECT CODE_BARRE, CODE_MALADE FROM malade WHERE CODE_BARRE = ? OR CODE_MALADE = ?",
      [patId, patId]
    );
    if (patRows.length === 0) return res.json([]);

    const cb = patRows[0].CODE_BARRE;
    const cm = patRows[0].CODE_MALADE;

    const [rows] = await pool.query(
      `SELECT a.ID_ALLERGIE as id, a.DESIGNATION as designation
       FROM allergie_malade am
       JOIN allergie a ON am.ID_ALLERGIE = a.ID_ALLERGIE
       WHERE am.ID_MALADE = ? OR am.ID_MALADE = ?`,
      [cb, cm]
    );
    res.json(rows.map(r => (r.designation ? r.designation.trim() : '')).filter(Boolean));
  } catch (err) {
    console.error("API GET /api/patients/:id/allergies Error:", err);
    res.status(500).json({ error: "Failed to fetch patient allergies" });
  }
});

// POST /api/patients/:id/allergies - Sync allergies list for a patient
router.post("/:id/allergies", async (req, res) => {
  try {
    const patId = req.params.id;
    const { allergies, designation } = req.body;
    const items = Array.isArray(allergies)
      ? allergies
      : designation
        ? [designation]
        : [];

    const [patRows] = await pool.query(
      "SELECT CODE_BARRE, CODE_MALADE FROM malade WHERE CODE_BARRE = ? OR CODE_MALADE = ?",
      [patId, patId]
    );
    if (patRows.length === 0) return res.status(404).json({ error: "Patient not found" });

    const patientIdForInsert = patRows[0].CODE_BARRE || patRows[0].CODE_MALADE;
    const ids = Array.from(new Set([patRows[0].CODE_BARRE, patRows[0].CODE_MALADE].filter(Boolean)));

    // Clear existing patient allergies
    await pool.query("DELETE FROM allergie_malade WHERE ID_MALADE IN (?)", [ids]);

    for (const rawItem of items) {
      const item = String(rawItem).trim();
      if (!item) continue;

      let idAlg = null;
      const [existing] = await pool.query(
        "SELECT ID_ALLERGIE FROM allergie WHERE DESIGNATION = ?",
        [item]
      );

      if (existing.length > 0) {
        idAlg = existing[0].ID_ALLERGIE;
      } else {
        const [maxRow] = await pool.query("SELECT COALESCE(MAX(ID_ALLERGIE), 0) + 1 as nextId FROM allergie");
        idAlg = maxRow[0].nextId;
        await pool.query(
          "INSERT INTO allergie (ID_ALLERGIE, DESIGNATION) VALUES (?, ?)",
          [idAlg, item]
        );
      }

      await pool.query(
        "INSERT IGNORE INTO allergie_malade (ID_ALLERGIE, ID_MALADE) VALUES (?, ?)",
        [idAlg, patientIdForInsert]
      );
    }

    res.json({ success: true, count: items.length });
  } catch (err) {
    console.error("API POST /api/patients/:id/allergies Error:", err);
    res.status(500).json({ error: "Failed to save patient allergies" });
  }
});

export default router;
