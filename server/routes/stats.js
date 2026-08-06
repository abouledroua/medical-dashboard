import express from "express";
import pool, { myDB } from "../db.js";

const router = express.Router();

// GET /api/stats - Dashboard metric summary
router.get("/", async (req, res) => {
  try {
    const [[totPatients]] = await pool.query(
      "SELECT COUNT(*) as count FROM malade"
    );

    const [[totAppts]] = await pool.query(
      "SELECT COUNT(*) as count FROM rdv WHERE (ETAT_RDV IS NULL OR ETAT_RDV != 3) AND DATE_RDV >= CURDATE() AND DATE_RDV < CURDATE() + INTERVAL 1 DAY"
    );
    const [[critCases]] = await pool.query(
      "SELECT COUNT(*) as count FROM malade WHERE DETTE > 0"
    );
    const [[activeCases]] = await pool.query(
      "SELECT COUNT(*) as count FROM consultation WHERE DATE(DATE_CONSULTATION) = CURDATE() AND (ETAT IS NULL OR ETAT != 2)"
    );
    const [[newPatientsThisMonth]] = await pool.query(
      "SELECT COUNT(*) as count FROM malade WHERE MONTH(DATE_CREATION) = MONTH(CURDATE()) AND YEAR(DATE_CREATION) = YEAR(CURDATE())"
    );

    const [nextAppointmentRows] = await pool.query(
      `SELECT r.HEURE_RDV, r.HEURE_ARRIVEE, r.MOTIF_RAPPEL, m.NOM, m.PRENOM
       FROM rdv r
       LEFT JOIN malade m ON r.ID_MALADE = m.CODE_BARRE
       WHERE (r.ETAT_RDV IS NULL OR r.ETAT_RDV != 3) AND r.DATE_RDV >= CURDATE() AND r.DATE_RDV < CURDATE() + INTERVAL 1 DAY
       ORDER BY r.HEURE_RDV ASC
       LIMIT 1`
    );
    const nextAppointment = nextAppointmentRows[0] || null;

    res.json({
      dbName: myDB,
      totalPatients: totPatients.count || 0,
      todayAppointments: totAppts.count || 0,
      criticalCases: critCases.count || 0,
      activeTreatments: activeCases.count || 0,
      newPatientsThisMonth: newPatientsThisMonth.count || 0,
      nextAppointment: nextAppointment ? {
        time: nextAppointment.HEURE_ARRIVEE || nextAppointment.HEURE_RDV,
        patientName: `${nextAppointment.PRENOM || ''} ${nextAppointment.NOM || ''}`.trim()
      } : null,
    });
  } catch (err) {
    console.error("API /api/stats Error:", err);
    res.status(500).json({ error: "Database query failed" });
  }
});

export default router;
