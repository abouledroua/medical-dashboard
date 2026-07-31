import express from "express";
import pool from "../db.js";

const router = express.Router();

// POST /api/consultations/start - Start ongoing consultation (ETAT = 3) and create versement_malade row
router.post("/start", async (req, res) => {
  try {
    const { patientId, deviceId } = req.body;
    if (!patientId) {
      return res.status(400).json({ error: "patientId is required" });
    }

    // 0. Check if patient has an existing non-cancelled consultation today (ETAT != 2)
    const [existingRows] = await pool.query(
      "SELECT * FROM consultation WHERE ID_MALADE = ? AND DATE(DATE_CONSULTATION) = CURRENT_DATE() AND ETAT != 2 ORDER BY ID_CONSULTATION DESC LIMIT 1",
      [String(patientId)]
    );

    if (existingRows.length > 0) {
      const existing = existingRows[0];
      return res.json({
        success: true,
        isExisting: true,
        idConsultation: existing.ID_CONSULTATION,
        idVersement: existing.ID_VERSEMENT,
        exercice: existing.EXERCICE,
        etat: existing.ETAT,
        total: existing.TOTAL,
        deviceId: existing.ID_POSTE || (deviceId ? String(deviceId) : "")
      });
    }

    // 1. Fetch PRIX_CONSULTATION from parametre
    let prixConsultation = 0;
    const [paramRows] = await pool.query("SELECT PRIX_CONSULTATION FROM parametre LIMIT 1");
    if (paramRows.length > 0 && paramRows[0].PRIX_CONSULTATION != null) {
      prixConsultation = Number(paramRows[0].PRIX_CONSULTATION) || 0;
    }

    // 2. Generate next ID_VERSEMENT and insert into versement_malade
    const [vMax] = await pool.query("SELECT COALESCE(MAX(ID_VERSEMENT), 0) + 1 AS nextId FROM versement_malade");
    const idVersement = vMax[0].nextId;

    await pool.query(
      "INSERT INTO versement_malade (ID_VERSEMENT, ID_MALADE, DATE_VERSEMENT, MONTANT_VERSEMENT) VALUES (?, ?, NOW(), ?)",
      [idVersement, String(patientId), prixConsultation]
    );

    // 3. Generate next ID_CONSULTATION per EXERCICE year and insert into consultation with ETAT = 3 (ONGOING)
    const exercice = String(new Date().getFullYear());
    const [cMax] = await pool.query(
      "SELECT COALESCE(MAX(ID_CONSULTATION), 0) + 1 AS nextId FROM consultation WHERE EXERCICE = ?",
      [exercice]
    );
    const idConsultation = cMax[0].nextId;
    const userId = Number(req.headers["x-user-id"]) || 1;
    const posteId = deviceId ? String(deviceId) : "";

    await pool.query(
      `INSERT INTO consultation (
        ID_CONSULTATION, ID_MALADE, DATE_CONSULTATION, EXERCICE, TOTAL, ETAT, ID_USER, ID_VERSEMENT, ID_POSTE, FOCUS, INT_CONSULTATION, INT_LASER, INT_SCLERO
      ) VALUES (?, ?, NOW(), ?, ?, 3, ?, ?, ?, 0, 1, 0, 0)`,
      [idConsultation, String(patientId), exercice, prixConsultation, userId, idVersement, posteId]
    );

    res.json({
      success: true,
      idConsultation,
      idVersement,
      exercice,
      prixConsultation,
      deviceId: posteId
    });
  } catch (err) {
    console.error("API POST /api/consultations/start Error:", err);
    res.status(500).json({ error: "Failed to start ongoing consultation" });
  }
});

// POST /api/consultations/cancel - Cancel ongoing consultation and delete consultation & versement rows
// Deleting a consultation strictly requires BOTH ID_CONSULTATION AND EXERCICE
router.post("/cancel", async (req, res) => {
  try {
    const { idConsultation, exercice, idVersement } = req.body;

    if (idConsultation && exercice) {
      await pool.query(
        "DELETE FROM consultation WHERE ID_CONSULTATION = ? AND EXERCICE = ?",
        [idConsultation, String(exercice)]
      );
    } else if (idConsultation && !exercice) {
      console.warn("Consultation delete skipped: BOTH idConsultation AND exercice are required.");
    }

    if (idVersement) {
      await pool.query("DELETE FROM versement_malade WHERE ID_VERSEMENT = ?", [idVersement]);
    }

    res.json({
      success: true,
      deletedConsultationId: idConsultation,
      deletedExercice: exercice,
      deletedVersementId: idVersement
    });
  } catch (err) {
    console.error("API POST /api/consultations/cancel Error:", err);
    res.status(500).json({ error: "Failed to cancel ongoing consultation" });
  }
});

// DELETE /api/consultations/:idConsultation/:exercice - Delete consultation strictly by ID_CONSULTATION AND EXERCICE
router.delete("/:idConsultation/:exercice", async (req, res) => {
  try {
    const { idConsultation, exercice } = req.params;
    const { idVersement } = req.query;

    if (!idConsultation || !exercice) {
      return res.status(400).json({ error: "Both idConsultation and exercice are required." });
    }

    const [result] = await pool.query(
      "DELETE FROM consultation WHERE ID_CONSULTATION = ? AND EXERCICE = ?",
      [idConsultation, String(exercice)]
    );

    if (idVersement) {
      await pool.query("DELETE FROM versement_malade WHERE ID_VERSEMENT = ?", [idVersement]);
    }

    res.json({
      success: true,
      affectedRows: result.affectedRows,
      deletedConsultationId: idConsultation,
      deletedExercice: exercice,
      deletedVersementId: idVersement || null
    });
  } catch (err) {
    console.error("API DELETE /api/consultations Error:", err);
    res.status(500).json({ error: "Failed to delete consultation" });
  }
});

export default router;
