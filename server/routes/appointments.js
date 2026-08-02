import express from "express";
import pool from "../db.js";

const router = express.Router();

// Helper to compute NUM_RDV based on business rules
async function computeNumRdv(dateStr, heureArrivee, existingNumRdv = 0) {
  const nowD = new Date();
  const todayString = `${nowD.getFullYear()}-${String(nowD.getMonth() + 1).padStart(2, "0")}-${String(nowD.getDate()).padStart(2, "0")}`;
  const formattedDate = dateStr ? String(dateStr).substring(0, 10) : "";
  const isToday = (formattedDate === todayString);

  if (!isToday || !heureArrivee || String(heureArrivee).trim() === "") {
    return 0;
  }

  if (existingNumRdv && Number(existingNumRdv) > 0) {
    return Number(existingNumRdv);
  }

  const [[paramRow]] = await pool.query("SELECT NUM_RDV FROM parametre LIMIT 1");
  const paramNumRdv = paramRow ? Number(paramRow.NUM_RDV) : 0;

  if (paramNumRdv === 1) {
    const [[maxRow]] = await pool.query("SELECT MAX(NUM_RDV) as maxNum FROM rdv");
    return (maxRow?.maxNum || 0) + 1;
  } else {
    const [[maxRow]] = await pool.query(
      "SELECT MAX(NUM_RDV) as maxNum FROM rdv WHERE DATE_RDV >= ? AND DATE_RDV < ? + INTERVAL 1 DAY",
      [todayString, todayString]
    );
    return (maxRow?.maxNum || 0) + 1;
  }
}

// GET /api/appointments - List appointments from rdv table
router.get("/", async (req, res) => {
  try {
    const { date, patientId, search, limit = 100 } = req.query;
    let query = `
      SELECT 
        r.ID_RDV, r.ID_MALADE, DATE_FORMAT(r.DATE_RDV, '%Y-%m-%d') as DATE_RDV_STR, r.HEURE_RDV, r.HEURE_ARRIVEE, r.ETAT_RDV, r.MOTIF_RAPPEL, r.NUM_RDV, r.ID_MOTIF_RDV, r.ID_REGION, r.PERIODE,
        m.NOM, m.PRENOM, m.CODE_BARRE, m.CODE_MALADE, m.TEL
      FROM rdv r
      LEFT JOIN malade m ON r.ID_MALADE = m.CODE_BARRE
      WHERE (r.ETAT_RDV IS NULL OR r.ETAT_RDV != 3)
    `;
    const params = [];

    if (date) {
      query += ` AND r.DATE_RDV >= ? AND r.DATE_RDV < ? + INTERVAL 1 DAY`;
      params.push(date, date);
    }

    if (patientId) {
      query += ` AND r.ID_MALADE = ?`;
      params.push(patientId);
    }

    if (search) {
      const q = `%${search.trim()}%`;
      query += ` AND (m.NOM LIKE ? OR m.PRENOM LIKE ? OR CONCAT(m.NOM, ' ', m.PRENOM) LIKE ? OR m.CODE_BARRE LIKE ? OR m.CODE_MALADE LIKE ? OR r.ID_MALADE LIKE ? OR r.MOTIF_RAPPEL LIKE ? OR r.NUM_RDV LIKE ?)`;
      params.push(q, q, q, q, q, q, q, q);
    }

    query += ` ORDER BY r.DATE_RDV DESC, r.NUM_RDV ASC LIMIT ?`;
    params.push(Number(limit));

    let rows = [];
    try {
      [rows] = await pool.query(query, params);
    } catch (e) {
      // Fallback query without r.PERIODE if column doesn't exist on legacy DB
      const fallbackQuery = query.replace("r.PERIODE,", "");
      [rows] = await pool.query(fallbackQuery, params);
    }

    const nowD = new Date();
    const todayStr = `${nowD.getFullYear()}-${String(nowD.getMonth() + 1).padStart(2, "0")}-${String(nowD.getDate()).padStart(2, "0")}`;

    const result = rows.map((r) => {
      const dateStr = r.DATE_RDV_STR || "";
      const hasArrival =
        r.HEURE_ARRIVEE &&
        String(r.HEURE_ARRIVEE).trim() !== "" &&
        String(r.HEURE_ARRIVEE).trim() !== "00:00:00";
      const isToday = dateStr === todayStr;

      let status = "Scheduled";
      if (hasArrival && isToday) {
        status = "In Progress";
      } else if (Number(r.ETAT_RDV) === 1) {
        status = "Completed";
      } else if (Number(r.ETAT_RDV) === 3) {
        status = "Canceled";
      } else if (Number(r.ETAT_RDV) === 0) {
        status = "Scheduled";
      }

      const rawTime = hasArrival ? r.HEURE_ARRIVEE : r.HEURE_RDV;
      const displayTime =
        rawTime &&
        String(rawTime).trim() !== "" &&
        String(rawTime).trim() !== "00:00:00"
          ? String(rawTime).trim().substring(0, 5)
          : "";

      return {
        id: `apt-${r.ID_RDV}`,
        rawId: r.ID_RDV,
        patientId: r.CODE_BARRE || r.ID_MALADE,
        patientName: r.NOM
          ? `${r.NOM || ""} ${r.PRENOM || ""}`.trim()
          : `Patient #${r.ID_MALADE}`,
        mrn: r.CODE_MALADE || r.CODE_BARRE || r.ID_MALADE,
        phone: r.TEL || "N/A",
        date: dateStr,
        time: displayTime,
        doctor: "Dr. A. BENKERMI Ep. TATI",
        department: "ORL",
        reason: r.MOTIF_RAPPEL || "Consultation RDV",
        type: "In-Person",
        status,
        num_rdv: r.NUM_RDV || 0,
        motifId: r.ID_MOTIF_RDV || 0,
        regionId: r.ID_REGION || 0,
        periode: r.PERIODE || "",
      };
    });

    res.json(result);
  } catch (err) {
    console.error("API GET /api/appointments Error:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch appointments from rdv table" });
  }
});

// POST /api/appointments - Schedule new appointment in rdv
router.post("/", async (req, res) => {
  try {
    const { patientId, date, time, reason, motifId, regionId, periode } = req.body;
    const userId = Number(req.headers["x-user-id"]) || 0;

    if (!patientId || !date) {
      return res
        .status(400)
        .json({ error: "Patient ID and date are required." });
    }

    const [[maxIdRow]] = await pool.query(
      "SELECT MAX(ID_RDV) as maxId FROM rdv"
    );
    const nextId = (maxIdRow.maxId || 0) + 1;

    await pool.query(
      "DELETE FROM rdv WHERE ID_MALADE = ? AND (ETAT_RDV IS NULL OR ETAT_RDV NOT IN (1, 3))",
      [patientId]
    );

    const nowD = new Date();
    const todayString = `${nowD.getFullYear()}-${String(nowD.getMonth() + 1).padStart(2, "0")}-${String(nowD.getDate()).padStart(2, "0")}`;
    const isToday = (date === todayString);

    const heureArrivee = req.body.heureArrivee || (isToday ? nowD.toTimeString().split(' ')[0] : null);
    const nextNumRdv = await computeNumRdv(date, heureArrivee);
    const heureRdv = ''; // Always empty

    try {
      await pool.query(
        `INSERT INTO rdv (ID_RDV, ID_MALADE, DATE_RDV, HEURE_RDV, HEURE_ARRIVEE, ETAT_RDV, MOTIF_RAPPEL, NUM_RDV, SMS_ALERT, CALLS, SMS_CONFIRM, ID_MOTIF_RDV, ID_REGION, ID_USER, TYPE_RDV, PERIODE)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          nextId,
          patientId,
          date,
          heureRdv,
          heureArrivee,
          0,
          reason || "Consultation",
          nextNumRdv,
          0,
          0,
          0,
          motifId || 0,
          regionId || 0,
          userId,
          1,
          periode || "",
        ]
      );
    } catch (e) {
      await pool.query(
        `INSERT INTO rdv (ID_RDV, ID_MALADE, DATE_RDV, HEURE_RDV, HEURE_ARRIVEE, ETAT_RDV, MOTIF_RAPPEL, NUM_RDV, SMS_ALERT, CALLS, SMS_CONFIRM, ID_MOTIF_RDV, ID_REGION, ID_USER, TYPE_RDV)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          nextId,
          patientId,
          date,
          heureRdv,
          heureArrivee,
          0,
          reason || "Consultation",
          nextNumRdv,
          0,
          0,
          0,
          motifId || 0,
          regionId || 0,
          userId,
          1,
        ]
      );
    }

    const [patRows] = await pool.query(
      "SELECT NOM, PRENOM, CODE_BARRE, CODE_MALADE FROM malade WHERE CODE_BARRE = ? OR CODE_MALADE = ?",
      [patientId, patientId]
    );
    const pat = patRows[0] || {};

    res.status(201).json({
      id: `apt-${nextId}`,
      rawId: nextId,
      patientId: pat.CODE_BARRE || patientId,
      patientName: pat.NOM
        ? `${pat.NOM || ""} ${pat.PRENOM || ""}`.trim()
        : `Patient #${patientId}`,
      mrn: pat.CODE_MALADE || patientId,
      date,
      time: heureArrivee,
      doctor: "Dr. A. BENKERMI Ep. TATI",
      department: "ORL",
      reason: reason || "Consultation",
      type: "In-Person",
      status: "Scheduled",
      num_rdv: nextNumRdv,
      motifId,
      regionId,
      periode: periode || "",
    });
  } catch (err) {
    console.error("API POST /api/appointments Error:", err);
    res.status(500).json({ error: "Failed to schedule appointment" });
  }
});

// PATCH /api/appointments/:id - Update status in rdv table
router.patch("/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const rawId = req.params.id.replace("apt-", "");
    const nowD = new Date();
    const todayString = `${nowD.getFullYear()}-${String(nowD.getMonth() + 1).padStart(2, "0")}-${String(nowD.getDate()).padStart(2, "0")}`;

    if (status === "In Progress") {
      const nowTime = nowD.toTimeString().split(" ")[0]; // HH:MM:SS
      const [[aptRow]] = await pool.query("SELECT DATE_FORMAT(DATE_RDV, '%Y-%m-%d') as dateStr, NUM_RDV FROM rdv WHERE ID_RDV = ?", [rawId]);
      const aptDate = aptRow ? aptRow.dateStr : todayString;
      const existingNum = aptRow ? aptRow.NUM_RDV : 0;
      const nextNumRdv = await computeNumRdv(aptDate, nowTime, existingNum);

      await pool.query("UPDATE rdv SET HEURE_ARRIVEE = ?, NUM_RDV = ?, ETAT_RDV = 0 WHERE ID_RDV = ?", [
        nowTime,
        nextNumRdv,
        rawId,
      ]);
      return res.json({ id: req.params.id, status, time: nowTime.substring(0, 5), num_rdv: nextNumRdv });
    } else {
      let etatVal = 0; // Scheduled
      if (status === "Completed") etatVal = 1;
      else if (status === "Canceled" || status === "Cancelled") etatVal = 3;

      await pool.query("UPDATE rdv SET ETAT_RDV = ? WHERE ID_RDV = ?", [
        etatVal,
        rawId,
      ]);
    }
    res.json({ id: req.params.id, status });
  } catch (err) {
    console.error("API PATCH appointment Error:", err);
    res.status(500).json({ error: "Failed to update appointment" });
  }
});

// PUT /api/appointments/:id - Update appointment details in rdv table
router.put("/:id", async (req, res) => {
  try {
    const rawId = req.params.id.replace("apt-", "");
    const { date, reason, status, motifId, regionId, periode } = req.body;

    const [[aptRow]] = await pool.query(
      "SELECT DATE_FORMAT(DATE_RDV, '%Y-%m-%d') as dateStr, HEURE_ARRIVEE, NUM_RDV FROM rdv WHERE ID_RDV = ?",
      [rawId]
    );

    let finalHeureArrivee = aptRow ? aptRow.HEURE_ARRIVEE : null;
    let finalNumRdv = aptRow ? aptRow.NUM_RDV : 0;

    const isDateChanged = aptRow ? (aptRow.dateStr !== date) : true;

    if (isDateChanged) {
      const nowD = new Date();
      const todayString = `${nowD.getFullYear()}-${String(nowD.getMonth() + 1).padStart(2, "0")}-${String(nowD.getDate()).padStart(2, "0")}`;
      const isToday = (date === todayString);

      if (!isToday) {
        finalHeureArrivee = null;
        finalNumRdv = 0;
      } else {
        finalHeureArrivee = req.body.heureArrivee || aptRow?.HEURE_ARRIVEE || nowD.toTimeString().split(' ')[0];
        finalNumRdv = await computeNumRdv(date, finalHeureArrivee, 0);
      }
    }

    let etatVal = 0; // Scheduled
    if (status === "Completed") etatVal = 1;
    else if (status === "Canceled" || status === "Cancelled") etatVal = 3;

    try {
      await pool.query(
        "UPDATE rdv SET DATE_RDV = ?, MOTIF_RAPPEL = ?, ETAT_RDV = ?, ID_MOTIF_RDV = ?, ID_REGION = ?, NUM_RDV = ?, HEURE_ARRIVEE = ?, PERIODE = ? WHERE ID_RDV = ?",
        [date, reason || "Consultation", etatVal, motifId || 0, regionId || 0, finalNumRdv, finalHeureArrivee, periode || "", rawId]
      );
    } catch (e) {
      await pool.query(
        "UPDATE rdv SET DATE_RDV = ?, MOTIF_RAPPEL = ?, ETAT_RDV = ?, ID_MOTIF_RDV = ?, ID_REGION = ?, NUM_RDV = ?, HEURE_ARRIVEE = ? WHERE ID_RDV = ?",
        [date, reason || "Consultation", etatVal, motifId || 0, regionId || 0, finalNumRdv, finalHeureArrivee, rawId]
      );
    }

    res.json({ id: req.params.id, date, reason, status, motifId, regionId, num_rdv: finalNumRdv, time: finalHeureArrivee, periode });
  } catch (err) {
    console.error("API PUT /api/appointments/:id Error:", err);
    res.status(500).json({ error: "Failed to update appointment" });
  }
});

export default router;
