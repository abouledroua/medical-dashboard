import express from "express";
import pool from "../db.js";
import { getPrescriptionsForConsultation, getAssureInfoForConsultation } from "../helpers/utils.js";

const router = express.Router();

// GET /api/consultations/today - Fetch today's existing consultation and all its saved data for a patient
router.get("/today", async (req, res) => {
  try {
    const patientId = req.query.patientId;
    if (!patientId) {
      return res.status(400).json({ error: "patientId is required" });
    }

    const [patRows] = await pool.query(
      "SELECT CODE_BARRE, CODE_MALADE FROM malade WHERE CODE_BARRE = ? OR CODE_MALADE = ?",
      [patientId, patientId]
    );

    const ids = [String(patientId)];
    if (patRows.length > 0) {
      if (patRows[0].CODE_BARRE) ids.push(String(patRows[0].CODE_BARRE));
      if (patRows[0].CODE_MALADE) ids.push(String(patRows[0].CODE_MALADE));
    }

    const [cRows] = await pool.query(
      "SELECT * FROM consultation WHERE ID_MALADE IN (?) AND DATE(DATE_CONSULTATION) = CURRENT_DATE() AND ETAT != 2 ORDER BY ID_CONSULTATION DESC LIMIT 1",
      [ids]
    );

    if (cRows.length === 0) {
      return res.json({ exists: false });
    }

    const c = cRows[0];
    const dateStr = c.DATE_CONSULTATION
      ? new Date(c.DATE_CONSULTATION).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    // Fetch prescriptions from details_ordonnance_YYYY table
    const dbPrescriptions = await getPrescriptionsForConsultation(c.ID_CONSULTATION, dateStr);

    // Fetch obs_malade entry for today
    const [obsRows] = await pool.query(
      "SELECT OBS FROM obs_malade WHERE ID_MALADE IN (?) AND DATE_OBS = ? ORDER BY ID DESC LIMIT 1",
      [ids, dateStr]
    );

    let structuredData = {};
    let obsText = "";
    if (obsRows.length > 0) {
      obsText = obsRows[0].OBS || "";
      if (obsText.includes("{")) {
        try {
          const jsonStr = obsText.substring(obsText.indexOf("{"));
          structuredData = JSON.parse(jsonStr);
        } catch (eJson) {
          // ignore
        }
      }
    }

    const prescriptions = (structuredData.prescriptions && structuredData.prescriptions.length > 0)
      ? structuredData.prescriptions
      : dbPrescriptions;

    // Fetch Assuré info for this consultation with fallback to patient info
    const assureInfo = await getAssureInfoForConsultation(
      c.ID_CONSULTATION,
      dateStr,
      patientId,
      obsText
    );

    res.json({
      exists: true,
      consultation: {
        idConsultation: c.ID_CONSULTATION,
        exercice: c.EXERCICE,
        idVersement: c.ID_VERSEMENT,
        etat: c.ETAT,
        total: c.TOTAL,
        activeDocType: structuredData.activeDocType || "ordonnance",
        prescriptionMode: structuredData.prescriptionMode || (Number(c.ETAT) === 2 ? "prescription" : "medicaments"),
        freeTextPrescription: structuredData.freeTextPrescription || "",
        prescriptions: prescriptions,
        assureInfo: assureInfo,
        certificat: structuredData.certificat || null,
        bilan: structuredData.bilan || null,
        orientation: structuredData.orientation || null,
        arretTravail: structuredData.arretTravail || null,
        docMedical: structuredData.docMedical || null,
        nextAppointment: structuredData.nextAppointment || null,
        obsText
      }
    });
  } catch (err) {
    console.error("API GET /api/consultations/today Error:", err);
    res.status(500).json({ error: "Failed to fetch today's consultation" });
  }
});

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

// POST /api/consultations/cancel - Cancel ongoing consultation and delete consultation & relative info if ETAT != 1
router.post("/cancel", async (req, res) => {
  try {
    let { idConsultation, exercice, idVersement, patientId } = req.body;

    let patientIds = [];
    if (patientId) {
      patientIds = [String(patientId)];
      const [patRows] = await pool.query(
        "SELECT CODE_BARRE, CODE_MALADE FROM malade WHERE CODE_BARRE = ? OR CODE_MALADE = ?",
        [patientId, patientId]
      );
      if (patRows.length > 0) {
        if (patRows[0].CODE_BARRE) patientIds.push(String(patRows[0].CODE_BARRE));
        if (patRows[0].CODE_MALADE) patientIds.push(String(patRows[0].CODE_MALADE));
      }

      if (!idConsultation) {
        const [cUnvalidated] = await pool.query(
          "SELECT ID_CONSULTATION, EXERCICE, ID_VERSEMENT FROM consultation WHERE ID_MALADE IN (?) AND DATE(DATE_CONSULTATION) = CURRENT_DATE() AND (ETAT IS NULL OR ETAT != 1) ORDER BY ID_CONSULTATION DESC LIMIT 1",
          [patientIds]
        );
        if (cUnvalidated.length > 0) {
          idConsultation = cUnvalidated[0].ID_CONSULTATION;
          if (!exercice) exercice = cUnvalidated[0].EXERCICE;
          if (!idVersement) idVersement = cUnvalidated[0].ID_VERSEMENT;
        }
      }
    }

    if (idConsultation && !exercice) {
      const [cRows] = await pool.query(
        "SELECT EXERCICE, ID_VERSEMENT FROM consultation WHERE ID_CONSULTATION = ? LIMIT 1",
        [idConsultation]
      );
      if (cRows.length > 0) {
        exercice = cRows[0].EXERCICE;
        if (!idVersement && cRows[0].ID_VERSEMENT) idVersement = cRows[0].ID_VERSEMENT;
      } else {
        exercice = String(new Date().getFullYear());
      }
    }

    if (idConsultation && exercice) {
      // Check if consultation is already validated (ETAT = 1)
      const [checkRows] = await pool.query(
        "SELECT ETAT, ID_VERSEMENT FROM consultation WHERE ID_CONSULTATION = ? AND EXERCICE = ?",
        [idConsultation, String(exercice)]
      );

      if (checkRows.length > 0) {
        if (Number(checkRows[0].ETAT) === 1) {
          return res.json({
            success: true,
            skipped: true,
            reason: "Consultation is already validated (ETAT = 1)"
          });
        }
        if (!idVersement && checkRows[0].ID_VERSEMENT) {
          idVersement = checkRows[0].ID_VERSEMENT;
        }
      }

      // Delete unvalidated consultation row
      await pool.query(
        "DELETE FROM consultation WHERE ID_CONSULTATION = ? AND EXERCICE = ? AND (ETAT IS NULL OR ETAT != 1)",
        [idConsultation, String(exercice)]
      );

      // Delete relative prescription entries
      const year = String(exercice);
      const tableName = `details_ordonnance_${year}`;
      const [tCheck] = await pool.query("SHOW TABLES LIKE ?", [tableName]);
      if (tCheck.length > 0) {
        await pool.query(`DELETE FROM \`${tableName}\` WHERE ID_CONSULTATION = ? AND EXERCICE = ?`, [idConsultation, year]);
      }

      const ordTable = `ordonnance_consult_${year}`;
      const [ordCheck] = await pool.query("SHOW TABLES LIKE ?", [ordTable]);
      if (ordCheck.length > 0) {
        await pool.query(`DELETE FROM \`${ordTable}\` WHERE ID_CONSULTATION = ? AND EXERCICE = ?`, [idConsultation, year]);
      }
    }

    if (idVersement) {
      await pool.query("DELETE FROM versement_malade WHERE ID_VERSEMENT = ?", [idVersement]);
    }

    if (patientIds.length > 0) {
      await pool.query(
        "DELETE FROM obs_malade WHERE ID_MALADE IN (?) AND (DATE_OBS = CURRENT_DATE() OR DATE(DATE_OBS) = CURRENT_DATE())",
        [patientIds]
      );
    }

    res.json({
      success: true,
      deletedConsultationId: idConsultation || null,
      deletedExercice: exercice || null,
      deletedVersementId: idVersement || null
    });
  } catch (err) {
    console.error("API POST /api/consultations/cancel Error:", err);
    res.status(500).json({ error: "Failed to cancel ongoing consultation" });
  }
});

// DELETE /api/consultations/:idConsultation/:exercice - Delete consultation strictly requiring BOTH ID_CONSULTATION AND EXERCICE
router.delete("/:idConsultation/:exercice", async (req, res) => {
  try {
    const { idConsultation, exercice } = req.params;
    const { idVersement } = req.query;

    if (!idConsultation || !exercice) {
      return res.status(400).json({ error: "Both idConsultation and exercice are strictly required." });
    }

    const [result] = await pool.query(
      "DELETE FROM consultation WHERE ID_CONSULTATION = ? AND EXERCICE = ?",
      [idConsultation, String(exercice)]
    );

    const year = String(exercice);
    const tableName = `details_ordonnance_${year}`;
    const [tCheck] = await pool.query("SHOW TABLES LIKE ?", [tableName]);
    if (tCheck.length > 0) {
      await pool.query(`DELETE FROM \`${tableName}\` WHERE ID_CONSULTATION = ? AND EXERCICE = ?`, [idConsultation, year]);
    }

    const ordTable = `ordonnance_consult_${year}`;
    const [ordCheck] = await pool.query("SHOW TABLES LIKE ?", [ordTable]);
    if (ordCheck.length > 0) {
      await pool.query(`DELETE FROM \`${ordTable}\` WHERE ID_CONSULTATION = ? AND EXERCICE = ?`, [idConsultation, year]);
    }

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

// POST /api/consultations/validate - Validate/complete consultation requiring BOTH ID_CONSULTATION AND EXERCICE
router.post("/validate", async (req, res) => {
  try {
    const { idConsultation, exercice, patientId } = req.body;

    if (idConsultation && exercice) {
      await pool.query(
        "UPDATE consultation SET ETAT = 1 WHERE ID_CONSULTATION = ? AND EXERCICE = ?",
        [idConsultation, String(exercice)]
      );
    } else if (idConsultation && !exercice) {
      return res.status(400).json({ error: "Both idConsultation and exercice are strictly required for update." });
    }

    if (patientId) {
      await pool.query(
        "UPDATE consultation SET ETAT = 1 WHERE ID_MALADE = ? AND DATE(DATE_CONSULTATION) = CURRENT_DATE() AND ETAT != 2",
        [String(patientId)]
      );
    }

    res.json({
      success: true,
      etat: 1
    });
  } catch (err) {
    console.error("API POST /api/consultations/validate Error:", err);
    res.status(500).json({ error: "Failed to validate consultation" });
  }
});

export default router;
