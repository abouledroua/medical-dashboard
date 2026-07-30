import express from "express";
import cors from "cors";
import pool from "./db.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

async function requireExistingUser(req, res, next) {
  if (req.path === "/login") {
    return next();
  }

  try {
    const userId = Number(req.headers["x-user-id"]);
    if (!userId) {
      return res.status(401).json({ error: "Session expired" });
    }

    const [rows] = await pool.query(
      "SELECT ID_USER FROM users WHERE ID_USER = ? LIMIT 1",
      [userId],
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Session expired" });
    }

    return next();
  } catch (err) {
    console.error("Auth guard error:", err);
    return res.status(500).json({ error: "Authentication check failed" });
  }
}

// app.use("/api", requireExistingUser);

// Helper: Map Blood Group int from DB (1=A+, 2=A-, 3=B+, 4=B-, 5=AB+, 6=AB-, 7=O+, 8=O-, -1=None)
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function mapGS(gs) {
  const num = Number(gs);
  if (num >= 1 && num <= 8) {
    return BLOOD_GROUPS[num - 1];
  }
  return "";
}

function parseGS(bloodGroupStr) {
  if (!bloodGroupStr) return -1;
  const idx = BLOOD_GROUPS.indexOf(bloodGroupStr);
  return idx !== -1 ? idx + 1 : -1;
}

const CONSULTATION_OPTION_FIELDS = [
  "ORD",
  "CERT_MEDIC",
  "BILAN",
  "LET_OR",
  "ARRET_TRAV",
  "MOTIF",
];

function normalizeConsultationOption(value) {
  return Number(value) === 1 ? 1 : 0;
}

function normalizeRadioOption(value, defaultValue = 1) {
  return Number(value) || defaultValue;
}

function normalizeCheckboxOption(value) {
  return Number(value) === 1 ? 1 : 0;
}

function normalizeHoraireRow(row) {
  return {
    JOUR: row.JOUR ?? "",
    originalHEURE_DEBUT: row.HEURE_DEBUT ?? "0000",
    originalHEURE_FIN: row.HEURE_FIN ?? "0000",
    originalCONGE: Number(row.CONGE) === 1 ? 1 : 0,
    HEURE_DEBUT: row.HEURE_DEBUT ?? "0000",
    HEURE_FIN: row.HEURE_FIN ?? "0000",
    CONGE: Number(row.CONGE) === 1 ? 1 : 0,
  };
}

// WinDev algorithm for generating CODE_MALADE
async function generer_Code_Malade(lastName, firstName) {
  const plNom = ((lastName || "").trim()[0] || "X").toUpperCase();
  const plPrenom = ((firstName || "").trim()[0] || "X").toUpperCase();
  const prefix = plNom + plPrenom;

  try {
    const [rows] = await pool.query(
      "SELECT CODE_MALADE FROM malade WHERE CODE_MALADE LIKE ?",
      [`${prefix}%`],
    );
    const existingSet = new Set(rows.map((r) => r.CODE_MALADE));

    let cp = 1;
    while (true) {
      const candidate = `${prefix}${String(cp).padStart(4, "0")}`;
      if (!existingSet.has(candidate)) {
        return candidate;
      }
      cp++;
    }
  } catch (err) {
    console.error("Error generating CODE_MALADE:", err);
    return `${prefix}${String(Math.floor(1000 + Math.random() * 9000))}`;
  }
}

// Helper: Format patient record from MySQL row
function formatPatientRow(row) {
  const gender = row.SEXE === 2 ? "Female" : "Male";
  let dobStr = "";
  if (row.DATE_NAISSANCE) {
    try {
      dobStr = new Date(row.DATE_NAISSANCE).toISOString().split("T")[0];
    } catch (e) {
      dobStr = String(row.DATE_NAISSANCE);
    }
  }

  let status = "Active";
  if (row.DETTE && Number(row.DETTE) > 0) {
    status = "Billing";
  } else if (row.TYPE === 2) {
    status = "Inpatient";
  }

  let ageUnit = "years";
  if (Number(row.TYPE) === 2) {
    ageUnit = "months";
  } else if (Number(row.TYPE) === 3) {
    ageUnit = "days";
  }

  return {
    id: String(row.CODE_BARRE || row.CODE_MALADE || ""),
    mrn: String(row.CODE_MALADE || row.CODE_BARRE || ""),
    codeBarre: String(row.CODE_BARRE || ""),
    firstName: row.PRENOM || "",
    lastName: row.NOM || "",
    gender,
    age: Number(row.AGE) || 0,
    ageUnit,
    isPresumed: Number(row.PRESUME) === 1,
    dob: dobStr,
    phone: row.TEL || "N/A",
    email: row.EMAIL || "",
    profession: row.PROFESSION || row.FONCTION || "",
    address: row.ADRESSE || row.ID_ADRESSE || "",
    bloodGroup: mapGS(row.GS),
    heightCm: 170,
    weightKg: 70,
    bmi: 24.2,
    status,
    allergies: [],
    chronicConditions: row.DIAGNOSTIQUE ? [row.DIAGNOSTIQUE] : [],
    emergencyContact: {
      name: "N/A",
      relation: "Family",
      phone: row.TEL2 || row.TEL || "N/A",
    },
    vitals: {
      bloodPressure:
        row.lastHTA || row.HTA
          ? String(row.lastHTA || row.HTA).includes("/")
            ? `${row.lastHTA || row.HTA} mmHg`
            : `${row.lastHTA || row.HTA} cmHg`
          : "N/A",
      heartRate:
        row.lastBatement || row.BATEMENT
          ? `${row.lastBatement || row.BATEMENT} bpm`
          : "N/A",
      oxygenSat: row.lastSpo2 ? `${row.lastSpo2}%` : "N/A",
      temperature: "N/A",
      bloodGlucose: row.lastBg ? `${row.lastBg} g/L` : "N/A",
      lastUpdated: row.lastDateHTA
        ? new Date(row.lastDateHTA).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    },
    insurance: {
      provider: row.CONVENTIONNE ? "Conventionné" : "Standard",
      policyNumber: row.CODE_MALADE || "N/A",
      groupNumber: "GRP-100",
    },
  };
}

// 1. GET /api/stats - Dashboard metric summary
app.get("/api/stats", async (req, res) => {
  try {
    const [[totPatients]] = await pool.query(
      "SELECT COUNT(*) as count FROM malade",
    );

    const [[totAppts]] = await pool.query(
      "SELECT COUNT(*) as count FROM rdv WHERE (ETAT_RDV IS NULL OR ETAT_RDV != 3) AND DATE(DATE_RDV) = CURDATE()",
    );
    const [[critCases]] = await pool.query(
      "SELECT COUNT(*) as count FROM malade WHERE DETTE > 0",
    );
    const [[activeCases]] = await pool.query(
      "SELECT COUNT(*) as count FROM malade WHERE TYPE = 2",
    );
    const [[newPatientsThisMonth]] = await pool.query(
      "SELECT COUNT(*) as count FROM malade WHERE MONTH(DATE_CREATION) = MONTH(CURDATE()) AND YEAR(DATE_CREATION) = YEAR(CURDATE())"
    );

    const [nextAppointmentRows] = await pool.query(
      `SELECT r.HEURE_RDV, r.HEURE_ARRIVEE, r.MOTIF_RAPPEL, m.NOM, m.PRENOM
       FROM rdv r
       LEFT JOIN malade m ON r.ID_MALADE = m.CODE_BARRE OR r.ID_MALADE = m.CODE_MALADE
       WHERE (r.ETAT_RDV IS NULL OR r.ETAT_RDV != 3) AND DATE(r.DATE_RDV) = CURDATE()
       ORDER BY r.HEURE_RDV ASC
       LIMIT 1`
    );
    const nextAppointment = nextAppointmentRows[0] || null;

    res.json({
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

// 1b. GET /api/clinic - Clinic parameters metadata from parametre and param_consult tables
app.get("/api/clinic", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM parametre LIMIT 1");
    const [consultRows] = await pool.query(
      "SELECT * FROM param_consult LIMIT 1",
    );


    if (rows.length > 0) {
      const p = rows[0];
      const consultationOptions = consultRows[0] || {};
      res.json({
        raw: p,
        nomCabinet: p.NOM_CABINET ?? "",
        doctorNameFr: p.NOM_FR ?? "",
        doctorNameAr: p.NOM_AR ?? "",
        specialtyFr: (p.SPECIALITE_FR ?? "").replace(/\r\n/g, " • "),
        specialtyAr: (p.SPECIALITE_AR ?? "").replace(/\r\n/g, " • "),
        detailsSpecialite: p.DETAILS_SPECIALITE ?? "",
        phone: p.TEL ?? "",
        fixe: p.FIXE ?? "",
        addressFr: p.ADRESSE_FR ?? "",
        addressAr: p.ADRESSE_AR ?? "",
        city: p.VILLE ?? "",
        email: p.EMAIL ?? "",
        msgOrd: p.MSG_ORD ?? "",
        msgJaune: p.MSG_JAUNE ?? "",
        msgCloture: p.MSG_CLOTURE ?? "",
        ordre: p.ORDRE ?? "",
        prixConsultation: p.PRIX_CONSULTATION ?? 0,
        prixOrdonnance: p.PRIX_ORDONNANCE ?? 0,
        nbrRdv: p.NBR_RDV ?? 0,
        nbMinuteRdv: p.NB_MINUTE_RDV ?? 10,
        facebookPage: p.PAGE_FACEBOOK ?? "",
        website: p.SITE_WEB ?? "",
        minExercice: p.MIN_EXERCICE_DETAILS_ORD ?? 2011,
        maxExercice: p.MAX_EXERCICE_DETAILS_ORD ?? 2026,
        printerA4A5: p.PRINTER_A4_A5 || "",
        printerA3: p.PRINTER_A3 || "",
        printerBonTicket: p.PRINTER_BON_TICKET || "",
        printerBadge: p.PRINTER_BADGE || "",
        printerLabeler: p.PRINTER_LABELER || "",
        IMPR_ORD: normalizeRadioOption(p.IMPR_ORD),
        IMPR_ARRET: normalizeRadioOption(p.IMPR_ARRET),
        MODELE_ORD: normalizeRadioOption(p.MODELE_ORD),
        IMPR_ORIENTATION: normalizeRadioOption(p.IMPR_ORIENTATION),
        IMPR_PAPIER_PRE_IMPRIME: normalizeRadioOption(p.IMPR_PAPIER_PRE_IMPRIME),
        BAS_PAGE: normalizeRadioOption(p.BAS_PAGE),
        IMPR_BILAN: normalizeRadioOption(p.IMPR_BILAN),
        GEST_ORDONNANCE: normalizeRadioOption(p.GEST_ORDONNANCE),
        GEST_BILAN: normalizeRadioOption(p.GEST_BILAN),
        FREQ_MEDIC: normalizeRadioOption(p.FREQ_MEDIC),
        INFO_SUP_ORD: normalizeRadioOption(p.INFO_SUP_ORD, 2),
        MOTIF_RDV: normalizeRadioOption(p.MOTIF_RDV),
        NUM_RDV: normalizeRadioOption(p.NUM_RDV),
        GEST_RDV: normalizeCheckboxOption(p.GEST_RDV),
        RESUME_DERN_CONS: normalizeCheckboxOption(p.RESUME_DERN_CONS),
        GEST_IMAGE: normalizeCheckboxOption(p.GEST_IMAGE),
        APERCU: normalizeCheckboxOption(p.APERCU),
        ORD: normalizeConsultationOption(consultationOptions.ORD),
        CERT_MEDIC: normalizeConsultationOption(consultationOptions.CERT_MEDIC),
        BILAN: normalizeConsultationOption(consultationOptions.BILAN),
        LET_OR: normalizeConsultationOption(consultationOptions.LET_OR),
        ARRET_TRAV: normalizeConsultationOption(consultationOptions.ARRET_TRAV),
        MOTIF: normalizeConsultationOption(consultationOptions.MOTIF),
      });
    } else {
      res.json({
        doctorNameFr: "Dr. A. BENKERMI Ep. TATI",
        specialtyFr:
          "Spécialiste en Maladies et Chirurgie ORL • Thyroïde • Audition • Vertige",
        addressFr: "El Bouni ANNABA",
        phone: "0558 413 240",
        msgOrd: "Sauver des vies - Donnez de votre sang",
        GEST_ORDONNANCE: null,
        GEST_BILAN: null,
        FREQ_MEDIC: null,
        INFO_SUP_ORD: null,
        ORD: 1,
        CERT_MEDIC: 1,
        BILAN: 1,
        LET_OR: 1,
        ARRET_TRAV: 1,
        MOTIF: 1,
      });
    }
  } catch (err) {
    console.error("API /api/clinic Error:", err);
    res.status(500).json({ error: "Failed to fetch clinic parameters" });
  }
});

// 1d. GET /api/horaire - Working hours table
app.get("/api/horaire", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT *
       FROM horaire
       ORDER BY FIELD(
         UPPER(JOUR),
         'SAMEDI',
         'SATURDAY',
         'DIMANCHE',
         'SUNDAY',
         'LUNDI',
         'MONDAY',
         'MARDI',
         'TUESDAY',
         'MERCREDI',
         'WEDNESDAY',
         'JEUDI',
         'THURSDAY',
         'VENDREDI',
         'FRIDAY'
       ) ASC`,
    );
    res.json(rows.map(normalizeHoraireRow));
  } catch (err) {
    console.error("API /api/horaire Error:", err);
    res.status(500).json({ error: "Failed to fetch horaire table" });
  }
});

// 1e. PUT /api/horaire - Update a row in horaire
app.put("/api/horaire", requireExistingUser, async (req, res) => {
  try {
    const {
      JOUR,
      originalHEURE_DEBUT,
      originalHEURE_FIN,
      originalCONGE,
      HEURE_DEBUT,
      HEURE_FIN,
      CONGE,
    } = req.body;

    if (
      JOUR === undefined ||
      originalHEURE_DEBUT === undefined ||
      originalHEURE_FIN === undefined ||
      originalCONGE === undefined
    ) {
      return res.status(400).json({ error: "Original row values are required" });
    }

    const nextRow = {
      HEURE_DEBUT: CONGE === 1 ? "0000" : String(HEURE_DEBUT || "0000"),
      HEURE_FIN: CONGE === 1 ? "0000" : String(HEURE_FIN || "0000"),
      CONGE: Number(CONGE) === 1 ? 1 : 0,
    };
    const nextConge = Number(nextRow.CONGE) === 1 ? 1 : 0;

    const [result] = await pool.query(
      `UPDATE horaire
       SET HEURE_DEBUT = ?, HEURE_FIN = ?, CONGE = ?
       WHERE JOUR = ?
         AND HEURE_DEBUT = ?
         AND HEURE_FIN = ?
         AND CONGE = ?`,
      [
        nextRow.HEURE_DEBUT,
        nextRow.HEURE_FIN,
        nextConge,
        JOUR,
        originalHEURE_DEBUT,
        originalHEURE_FIN,
        Number(originalCONGE) === 1 ? 1 : 0,
      ],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Horaire row not found" });
    }

    res.json({
      success: true,
      row: {
        JOUR,
        originalHEURE_DEBUT: nextRow.HEURE_DEBUT,
        originalHEURE_FIN: nextRow.HEURE_FIN,
        originalCONGE: nextConge,
        ...nextRow,
      },
    });
  } catch (err) {
    console.error("API PUT /api/horaire Error:", err);
    res.status(500).json({ error: "Failed to update horaire row" });
  }
});

// 1f. GET /api/users - Minimal user list for settings
app.get("/api/users", requireExistingUser, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ID_USER, USERNAME, PASS_MOB, TYPE
       FROM users
       ORDER BY ID_USER ASC`,
    );

    res.json(
      rows.map((row) => ({
        id: row.ID_USER,
        username: row.USERNAME ?? "",
        password: row.PASS_MOB ?? "",
        type: Number(row.TYPE) === 1 ? 1 : 0,
      })),
    );
  } catch (err) {
    console.error("API /api/users Error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.post("/api/users", requireExistingUser, async (req, res) => {
  try {
    const { username, password, type } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const nextType = Number(type) === 1 ? 1 : 0;
    const [result] = await pool.query(
      `INSERT INTO users (USERNAME, PASSWORD, PASS_MOB, TYPE, FONCTION)
       VALUES (?, ?, ?, ?, ?)`,
      [username, password, password, nextType, nextType],
    );

    res.status(201).json({
      success: true,
      user: {
        id: result.insertId,
        username,
        password,
        type: nextType,
      },
    });
  } catch (err) {
    console.error("API POST /api/users Error:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

app.put("/api/users/:id", requireExistingUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, type } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const nextType = Number(type) === 1 ? 1 : 0;
    const [result] = await pool.query(
      `UPDATE users
       SET USERNAME = ?, PASSWORD = ?, PASS_MOB = ?, TYPE = ?, FONCTION = ?
       WHERE ID_USER = ?`,
      [username, password, password, nextType, nextType, id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      user: {
        id: Number(id),
        username,
        password,
        type: nextType,
      },
    });
  } catch (err) {
    console.error("API PUT /api/users/:id Error:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

app.delete("/api/users/:id", requireExistingUser, async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM users WHERE ID_USER = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("API DELETE /api/users/:id Error:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

app.get("/api/printers", (req, res) => {
  if (process.platform !== "win32") {
    return res
      .status(501)
      .json({ error: "Not implemented for non-Windows OS" });
  }

  const { exec } = require("child_process");
  exec("wmic printer get name", (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).json({ error: "Failed to get printers" });
    }
    const printers = stdout
      .split("\n")
      .slice(1)
      .map((p) => p.trim())
      .filter((p) => p);
    res.json(printers);
  });
});

// MOTIF RDV (APPOINTMENT REASON) ROUTES
app.get("/api/motif_rdv", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM motif_rdv ORDER BY DESIGNATION ASC");
    res.json(rows);
  } catch (err) {
    console.error("API /api/motif_rdv GET Error:", err);
    res.status(500).json({ error: "Failed to fetch appointment reasons" });
  }
});

app.post("/api/motif_rdv", async (req, res) => {
  try {
    const { DESIGNATION } = req.body;
    if (!DESIGNATION) {
      return res.status(400).json({ error: "Designation is required" });
    }
    const [result] = await pool.query(
      "INSERT INTO motif_rdv (DESIGNATION) VALUES (?)",
      [DESIGNATION]
    );
    res.status(201).json({
      ID_MOTIF_RDV: result.insertId,
      DESIGNATION,
    });
  } catch (err) {
    console.error("API /api/motif_rdv POST Error:", err);
    res.status(500).json({ error: "Failed to create appointment reason" });
  }
});

app.put("/api/motif_rdv/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { DESIGNATION } = req.body;
    if (!DESIGNATION) {
      return res.status(400).json({ error: "Designation is required" });
    }
    const [result] = await pool.query(
      "UPDATE motif_rdv SET DESIGNATION = ? WHERE ID_MOTIF_RDV = ?",
      [DESIGNATION, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Appointment reason not found" });
    }
    res.json({ success: true, ID_MOTIF_RDV: id, DESIGNATION });
  } catch (err) {
    console.error("API /api/motif_rdv PUT Error:", err);
    res.status(500).json({ error: "Failed to update appointment reason" });
  }
});

app.delete("/api/motif_rdv/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(
      "DELETE FROM motif_rdv WHERE ID_MOTIF_RDV = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Appointment reason not found" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("API /api/motif_rdv DELETE Error:", err);
    res.status(500).json({ error: "Failed to delete appointment reason" });
  }
});

// REGION ROUTES
app.get("/api/region", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM region ORDER BY DESIGNATION ASC");
    res.json(rows);
  } catch (err) {
    console.error("API /api/region GET Error:", err);
    res.status(500).json({ error: "Failed to fetch regions" });
  }
});

app.post("/api/region", async (req, res) => {
  try {
    const { DESIGNATION } = req.body;
    if (!DESIGNATION) {
      return res.status(400).json({ error: "Designation is required" });
    }
    const [result] = await pool.query(
      "INSERT INTO region (DESIGNATION) VALUES (?)",
      [DESIGNATION]
    );
    res.status(201).json({
      ID_REGION: result.insertId,
      DESIGNATION,
    });
  } catch (err) {
    console.error("API /api/region POST Error:", err);
    res.status(500).json({ error: "Failed to create region" });
  }
});

app.put("/api/region/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { DESIGNATION } = req.body;
    if (!DESIGNATION) {
      return res.status(400).json({ error: "Designation is required" });
    }
    const [result] = await pool.query(
      "UPDATE region SET DESIGNATION = ? WHERE ID_REGION = ?",
      [DESIGNATION, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Region not found" });
    }
    res.json({ success: true, ID_REGION: id, DESIGNATION });
  } catch (err) {
    console.error("API /api/region PUT Error:", err);
    res.status(500).json({ error: "Failed to update region" });
  }
});

app.delete("/api/region/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(
      "DELETE FROM region WHERE ID_REGION = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Region not found" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("API /api/region DELETE Error:", err);
    res.status(500).json({ error: "Failed to delete region" });
  }
});


// 1c. PUT /api/clinic - Update clinic parameters in parametre and param_consult tables
app.put("/api/clinic", async (req, res) => {
  try {
    const {
      nomCabinet,
      doctorNameFr,
      doctorNameAr,
      specialtyFr,
      specialtyAr,
      detailsSpecialite,
      phone,
      fixe,
      addressFr,
      addressAr,
      city,
      email,
      msgOrd,
      msgJaune,
      msgCloture,
      ordre,
      prixConsultation,
      prixOrdonnance,
      nbrRdv,
      nbMinuteRdv,
      facebookPage,
      website,
      minExercice,
      maxExercice,
      GEST_ORDONNANCE,
      GEST_BILAN,
      FREQ_MEDIC,
      INFO_SUP_ORD,
      MOTIF_RDV,
      NUM_RDV,
      IMPR_ORD,
      IMPR_ARRET,
      MODELE_ORD,
      IMPR_ORIENTATION,
      IMPR_PAPIER_PRE_IMPRIME,
      BAS_PAGE,
      IMPR_BILAN,
      GEST_RDV,
      RESUME_DERN_CONS,
      GEST_IMAGE,
      APERCU,
      ORD,
      CERT_MEDIC,
      BILAN,
      LET_OR,
      ARRET_TRAV,
      MOTIF,
    } = req.body;
    const gestRdvValue = normalizeCheckboxOption(GEST_RDV);
    const resumeDernConsValue = normalizeCheckboxOption(RESUME_DERN_CONS);
    const gestImageValue = normalizeCheckboxOption(GEST_IMAGE);
    const apercuValue = normalizeCheckboxOption(APERCU);

    const [rows] = await pool.query(
      "SELECT ID_PARAMETRE FROM parametre LIMIT 1",
    );
    if (rows.length === 0) {
      await pool.query(
        `INSERT INTO parametre (
          ID_PARAMETRE, NOM_CABINET, NOM_FR, NOM_AR, SPECIALITE_FR, SPECIALITE_AR, DETAILS_SPECIALITE, TEL, FIXE,
          ADRESSE_FR, ADRESSE_AR, VILLE, EMAIL, MSG_ORD, MSG_JAUNE, MSG_CLOTURE, ORDRE,
          PRIX_CONSULTATION, PRIX_ORDONNANCE, NBR_RDV, NB_MINUTE_RDV, PAGE_FACEBOOK, SITE_WEB,
          MIN_EXERCICE_DETAILS_ORD, MAX_EXERCICE_DETAILS_ORD, GEST_ORDONNANCE, GEST_BILAN, FREQ_MEDIC, INFO_SUP_ORD, MOTIF_RDV, NUM_RDV, IMPR_ORD, IMPR_ARRET, MODELE_ORD, IMPR_ORIENTATION, IMPR_PAPIER_PRE_IMPRIME, BAS_PAGE, IMPR_BILAN, GEST_RDV, RESUME_DERN_CONS, GEST_IMAGE, APERCU
        ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          nomCabinet || "",
          doctorNameFr || "",
          doctorNameAr || "",
          specialtyFr || "",
          specialtyAr || "",
          detailsSpecialite || "",
          phone || "",
          fixe || "",
          addressFr || "",
          addressAr || "",
          city || "",
          email || "",
          msgOrd || "",
          msgJaune || "",
          msgCloture || "",
          ordre || "",
          prixConsultation || 0,
          prixOrdonnance || 0,
          nbrRdv || 0,
          nbMinuteRdv || 10,
          facebookPage || "",
          website || "",
          minExercice || 2011,
          maxExercice || 2026,
          GEST_ORDONNANCE || null,
          GEST_BILAN || null,
          FREQ_MEDIC || null,
          INFO_SUP_ORD || null,
          MOTIF_RDV || 0,
          NUM_RDV || 0,
          IMPR_ORD || 1,
          IMPR_ARRET || 1,
          MODELE_ORD || 1,
          IMPR_ORIENTATION || 1,
          IMPR_PAPIER_PRE_IMPRIME || 1,
          BAS_PAGE || 1,
          IMPR_BILAN || 1,
          gestRdvValue,
          resumeDernConsValue,
          gestImageValue,
          apercuValue,
        ],
      );
    } else {
      await pool.query(
        `UPDATE parametre SET
          NOM_CABINET = ?, NOM_FR = ?, NOM_AR = ?, SPECIALITE_FR = ?, SPECIALITE_AR = ?, DETAILS_SPECIALITE = ?, TEL = ?, FIXE = ?,
          ADRESSE_FR = ?, ADRESSE_AR = ?, VILLE = ?, EMAIL = ?, MSG_ORD = ?, MSG_JAUNE = ?, MSG_CLOTURE = ?, ORDRE = ?,
          PRIX_CONSULTATION = ?, PRIX_ORDONNANCE = ?, NBR_RDV = ?, NB_MINUTE_RDV = ?, PAGE_FACEBOOK = ?, SITE_WEB = ?,
          MIN_EXERCICE_DETAILS_ORD = ?, MAX_EXERCICE_DETAILS_ORD = ?, GEST_ORDONNANCE = ?, GEST_BILAN = ?, FREQ_MEDIC = ?, INFO_SUP_ORD = ?, MOTIF_RDV = ?, NUM_RDV = ?, GEST_RDV = ?, RESUME_DERN_CONS = ?, GEST_IMAGE = ?, APERCU = ?,
          IMPR_ORD = ?, IMPR_ARRET = ?, MODELE_ORD = ?, IMPR_ORIENTATION = ?, IMPR_PAPIER_PRE_IMPRIME = ?, BAS_PAGE = ?, IMPR_BILAN = ?
        WHERE ID_PARAMETRE = ?`,
        [
          nomCabinet || "",
          doctorNameFr || "",
          doctorNameAr || "",
          specialtyFr || "",
          specialtyAr || "",
          detailsSpecialite || "",
          phone || "",
          fixe || "",
          addressFr || "",
          addressAr || "",
          city || "",
          email || "",
          msgOrd || "",
          msgJaune || "",
          msgCloture || "",
          ordre || "",
          prixConsultation || 0,
          prixOrdonnance || 0,
          nbrRdv || 0,
          nbMinuteRdv || 10,
          facebookPage || "",
          website || "",
          minExercice || 2011,
          maxExercice || 2026,
          GEST_ORDONNANCE || null,
          GEST_BILAN || null,
          FREQ_MEDIC || null,
          INFO_SUP_ORD || null,
          MOTIF_RDV || 0,
          NUM_RDV || 0,
          gestRdvValue,
          resumeDernConsValue,
          gestImageValue,
          apercuValue,
          IMPR_ORD || 1,
          IMPR_ARRET || 1,
          MODELE_ORD || 1,
          IMPR_ORIENTATION || 1,
          IMPR_PAPIER_PRE_IMPRIME || 1,
          BAS_PAGE || 1,
          IMPR_BILAN || 1,
          rows[0].ID_PARAMETRE,
        ],
      );
    }

    const consultationOptions = CONSULTATION_OPTION_FIELDS.map((field) =>
      normalizeConsultationOption(req.body[field]),
    );
    const [consultRows] = await pool.query(
      "SELECT ID FROM param_consult ORDER BY ID LIMIT 1",
    );

    if (consultRows.length > 0) {
      await pool.query(
        `UPDATE param_consult SET
          ORD = ?, CERT_MEDIC = ?, BILAN = ?, LET_OR = ?, ARRET_TRAV = ?, MOTIF = ?`,
        consultationOptions,
      );
    } else {
      await pool.query(
        `INSERT INTO param_consult (ORD, CERT_MEDIC, BILAN, LET_OR, ARRET_TRAV, MOTIF, EXPLOR)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        consultationOptions,
      );
    }

    res.json({
      success: true,
      nomCabinet,
      doctorNameFr,
      doctorNameAr,
      specialtyFr,
      specialtyAr,
      detailsSpecialite,
      phone,
      fixe,
      addressFr,
      addressAr,
      city,
      email,
      msgOrd,
      msgJaune,
      msgCloture,
      ordre,
      prixConsultation,
      prixOrdonnance,
      nbrRdv,
      nbMinuteRdv,
      facebookPage,
      website,
      minExercice,
      maxExercice,
      GEST_ORDONNANCE,
      GEST_BILAN,
      FREQ_MEDIC,
      INFO_SUP_ORD,
      GEST_RDV: gestRdvValue,
      RESUME_DERN_CONS: resumeDernConsValue,
      GEST_IMAGE: gestImageValue,
      APERCU: apercuValue,
      ORD,
      CERT_MEDIC,
      BILAN,
      LET_OR,
      ARRET_TRAV,
      MOTIF,
    });
  } catch (err) {
    console.error("API PUT /api/clinic Error:", err);
    res.status(500).json({ error: "Failed to update clinic parameters" });
  }
});

// 2. GET /api/patients - List patients from MySQL
app.get("/api/patients", async (req, res) => {
  try {
    const { search, status, gender, bloodGroup, limit = 500 } = req.query;
    let query = `
      SELECT m.*,
             (SELECT h.HTA FROM hta_malade h WHERE h.ID_MALADE = m.CODE_BARRE OR h.ID_MALADE = m.CODE_MALADE ORDER BY h.ID DESC LIMIT 1) as lastHTA,
             (SELECT h.BATEMENT FROM hta_malade h WHERE h.ID_MALADE = m.CODE_BARRE OR h.ID_MALADE = m.CODE_MALADE ORDER BY h.ID DESC LIMIT 1) as lastBatement,
             (SELECT h.DATE_HTA FROM hta_malade h WHERE h.ID_MALADE = m.CODE_BARRE OR h.ID_MALADE = m.CODE_MALADE ORDER BY h.ID DESC LIMIT 1) as lastDateHTA,
             (SELECT s.SPO2 FROM spo2_malade s WHERE s.ID_MALADE = m.CODE_BARRE OR s.ID_MALADE = m.CODE_MALADE ORDER BY s.DATE_PRISE DESC LIMIT 1) as lastSpo2,
             (SELECT b.BG FROM bg_malade b WHERE b.ID_MALADE = m.CODE_BARRE OR b.ID_MALADE = m.CODE_MALADE ORDER BY b.DATE_PRISE DESC LIMIT 1) as lastBg
      FROM malade m
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      const q = `%${search.trim()}%`;
      query += ` AND (NOM LIKE ? OR PRENOM LIKE ? OR CONCAT(NOM, ' ', PRENOM) LIKE ? OR CONCAT(PRENOM, ' ', NOM) LIKE ? OR CODE_BARRE LIKE ? OR CODE_MALADE LIKE ? OR TEL LIKE ? OR DIAGNOSTIQUE LIKE ?)`;
      params.push(q, q, q, q, q, q, q, q);
    }

    if (gender && gender !== "All") {
      const sexeVal =
        gender.toLowerCase() === "male"
          ? 1
          : gender.toLowerCase() === "female"
            ? 2
            : 0;
      query += ` AND SEXE = ?`;
      params.push(sexeVal);
    }

    query += ` ORDER BY NOM ASC, PRENOM ASC LIMIT ?`;
    params.push(Number(limit));

    const [rows] = await pool.query(query, params);
    let result = rows.map(formatPatientRow);

    if (status && status !== "All") {
      result = result.filter(
        (p) => p.status.toLowerCase() === status.toLowerCase(),
      );
    }

    if (bloodGroup && bloodGroup !== "All") {
      result = result.filter((p) => p.bloodGroup === bloodGroup);
    }

    res.json(result);
  } catch (err) {
    console.error("API /api/patients Error:", err);
    res.status(500).json({ error: "Failed to fetch patients from database" });
  }
});

// 3. POST /api/patients - Register new patient in MySQL
app.post("/api/patients", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      gender,
      dob,
      phone,
      email,
      chronicConditions,
    } = req.body;

    if (
      !firstName ||
      !lastName ||
      !gender ||
      (!dob && req.body.age === undefined)
    ) {
      return res.status(400).json({
        error:
          "Nom, Prénom, Genre et (Date de Naissance ou Âge) sont obligatoires.",
      });
    }

    const upperNom = lastName.trim().toUpperCase();
    const upperPrenom = firstName.trim().toUpperCase();

    // Check if patient already exists in database (matching NOM, PRENOM and DOB/Phone)
    let existingQuery =
      "SELECT CODE_MALADE, CODE_BARRE, NOM, PRENOM FROM malade WHERE NOM = ? AND PRENOM = ?";
    let queryParams = [upperNom, upperPrenom];

    if (dob) {
      existingQuery += " AND (DATE_NAISSANCE = ? OR AGE = ?)";
      const birthYear = new Date(dob).getFullYear();
      const ageCalc = new Date().getFullYear() - birthYear;
      queryParams.push(dob, ageCalc);
    } else if (phone && phone.trim()) {
      existingQuery += " AND TEL = ?";
      queryParams.push(phone.trim());
    }

    const [existingRows] = await pool.query(existingQuery, queryParams);
    if (existingRows.length > 0) {
      const match = existingRows[0];
      return res.status(409).json({
        error: `Le patient "${match.NOM} ${match.PRENOM}" existe déjà dans la base de données (NIP / Code: ${match.CODE_MALADE || match.CODE_BARRE}).`,
      });
    }

    // Get max CODE_BARRE
    const [[maxRow]] = await pool.query(
      "SELECT MAX(CAST(CODE_BARRE AS UNSIGNED)) as maxCode FROM malade",
    );
    const nextCodeNum = (maxRow.maxCode || 25694) + 1;
    const newCodeBarre = String(nextCodeNum).padStart(6, "0");
    const newCodeMalade = await generer_Code_Malade(lastName, firstName);

    const sexeVal = gender === "Female" ? 2 : 1;
    const birthYear = dob
      ? new Date(dob).getFullYear()
      : req.body.age
        ? new Date().getFullYear() - Number(req.body.age)
        : new Date().getFullYear();
    const age =
      req.body.age !== undefined
        ? Number(req.body.age)
        : new Date().getFullYear() - birthYear;
    let typeVal = 1;
    if (req.body.ageUnit === "months") {
      typeVal = 2;
    } else if (req.body.ageUnit === "days") {
      typeVal = 3;
    }

    const diag = Array.isArray(chronicConditions)
      ? chronicConditions.join(", ")
      : chronicConditions || "";
    const gsVal = parseGS(req.body.bloodGroup);
    const profVal = req.body.profession || "";

    // Fetch column schema for table malade to dynamically supply defaults for all NOT NULL fields
    const [cols] = await pool.query("SHOW COLUMNS FROM malade");
    const fieldsMap = {
      CODE_BARRE: newCodeBarre,
      CODE_MALADE: newCodeMalade,
      NOM: lastName.toUpperCase(),
      PRENOM: firstName.toUpperCase(),
      DATE_NAISSANCE: dob || `${new Date().getFullYear() - age}-01-01`,
      AGE: age,
      TYPE: typeVal,
      TEL: phone || "",
      EMAIL: email || "",
      FONCTION: profVal,
      PROFESSION: profVal,
      SEXE: sexeVal,
      DIAGNOSTIQUE: diag,
      GS: gsVal,
      ID_ADRESSE: req.body.address || "",
      ADRESSE: req.body.address || "",
      DETTE: 0,
      PRESUME: req.body.isPresumed ? 1 : 0,
      ASSURE: 0,
      ASSURANCE: 0,
      CREDIT: 0,
    };

    const insertCols = [];
    const insertVals = [];

    for (const col of cols) {
      const fieldName = col.Field;
      if (fieldsMap[fieldName] !== undefined) {
        insertCols.push(fieldName);
        insertVals.push(fieldsMap[fieldName]);
      } else if (
        col.Null === "NO" &&
        col.Default === null &&
        !col.Extra.includes("auto_increment")
      ) {
        insertCols.push(fieldName);
        const typeLower = (col.Type || "").toLowerCase();
        if (
          typeLower.includes("int") ||
          typeLower.includes("decimal") ||
          typeLower.includes("float") ||
          typeLower.includes("double")
        ) {
          insertVals.push(0);
        } else if (typeLower.includes("date") || typeLower.includes("time")) {
          insertVals.push("1990-01-01");
        } else {
          insertVals.push("");
        }
      }
    }

    const placeholders = insertCols.map(() => "?").join(", ");
    const sql = `INSERT INTO malade (${insertCols.join(", ")}) VALUES (${placeholders})`;
    await pool.query(sql, insertVals);

    const [rows] = await pool.query(
      "SELECT * FROM malade WHERE CODE_BARRE = ?",
      [newCodeBarre],
    );
    res.status(201).json(formatPatientRow(rows[0]));
  } catch (err) {
    console.error("API POST /api/patients Error:", err);
    res.status(500).json({ error: "Failed to register patient in database" });
  }
});

// 3b. PUT /api/patients/:id - Update existing patient in MySQL
app.put("/api/patients/:id", async (req, res) => {
  try {
    const patId = req.params.id;
    const {
      firstName,
      lastName,
      gender,
      dob,
      age,
      ageUnit,
      isPresumed,
      phone,
      email,
      profession,
      address,
      bloodGroup,
    } = req.body;

    if (!firstName || !lastName) {
      return res
        .status(400)
        .json({ error: "Nom et Prénom sont obligatoires." });
    }

    const [existing] = await pool.query(
      "SELECT * FROM malade WHERE CODE_BARRE = ? OR CODE_MALADE = ?",
      [patId, patId],
    );
    if (existing.length === 0) {
      return res
        .status(404)
        .json({ error: "Patient non trouvé dans la base de données." });
    }

    const targetCodeBarre = existing[0].CODE_BARRE;
    const sexeVal = gender === "Female" ? 2 : 1;
    const ageVal =
      age !== undefined ? Number(age) : Number(existing[0].AGE || 0);

    let typeVal = 1;
    if (ageUnit === "months") {
      typeVal = 2;
    } else if (ageUnit === "days") {
      typeVal = 3;
    }

    const gsVal = parseGS(bloodGroup);
    const presumeVal = isPresumed ? 1 : 0;
    const upperNom = lastName.trim().toUpperCase();
    const upperPrenom = firstName.trim().toUpperCase();

    // Dynamically update existing row based on available schema columns
    const [cols] = await pool.query("SHOW COLUMNS FROM malade");
    const availableFields = new Set(cols.map((c) => c.Field));

    const updates = [];
    const updateVals = [];

    const fieldMap = {
      NOM: upperNom,
      PRENOM: upperPrenom,
      SEXE: sexeVal,
      DATE_NAISSANCE: dob || `${new Date().getFullYear() - ageVal}-01-01`,
      AGE: ageVal,
      TYPE: typeVal,
      PRESUME: presumeVal,
      TEL: phone || "",
      EMAIL: email || "",
      PROFESSION: profession || "",
      FONCTION: profession || "",
      ADRESSE: address || "",
      ID_ADRESSE: address || "",
      GS: gsVal,
    };

    for (const [colName, val] of Object.entries(fieldMap)) {
      if (availableFields.has(colName)) {
        updates.push(`${colName} = ?`);
        updateVals.push(val);
      }
    }

    updateVals.push(targetCodeBarre);
    const sql = `UPDATE malade SET ${updates.join(", ")} WHERE CODE_BARRE = ?`;
    await pool.query(sql, updateVals);

    const [updatedRows] = await pool.query(
      "SELECT * FROM malade WHERE CODE_BARRE = ?",
      [targetCodeBarre],
    );
    res.json(formatPatientRow(updatedRows[0]));
  } catch (err) {
    console.error("API PUT /api/patients/:id Error:", err);
    res
      .status(500)
      .json({ error: "Failed to update patient details in database" });
  }
});

// Helper: Fetch prescriptions for a consultation across details_ordonnance_YYYY tables
async function getPrescriptionsForConsultation(idConsultation, dateStr) {
  try {
    let year = "";
    if (dateStr && dateStr.includes("-")) {
      year = dateStr.split("-")[0];
    }
    if (!year || isNaN(year)) {
      year = new Date().getFullYear();
    }

    const tableName = `details_ordonnance_${year}`;

    // Check if partition table exists
    const [tCheck] = await pool.query("SHOW TABLES LIKE ?", [tableName]);
    if (tCheck.length === 0) return [];

    const [rows] = await pool.query(
      `SELECT d.DOSAGE as dosage, d.FREQUENCE as frequency, d.QTE as duration, m.DESIGNATION as name
       FROM ${tableName} d
       LEFT JOIN medicament m ON d.ID_MEDICAMENT = m.ID_MEDICAMENT
       WHERE d.ID_CONSULTATION = ?`,
      [idConsultation],
    );

    return rows.map((r) => ({
      name: r.name || "Médicament",
      dosage: r.dosage || "",
      frequency: r.frequency || "",
      duration: r.duration || "",
    }));
  } catch (e) {
    console.error("getPrescriptionsForConsultation error:", e.message);
    return [];
  }
}

// 4. GET /api/patients/:id - Single patient details
app.get("/api/patients/:id", async (req, res) => {
  try {
    const patId = req.params.id;
    const [rows] = await pool.query(
      "SELECT * FROM malade WHERE CODE_BARRE = ? OR CODE_MALADE = ?",
      [patId, patId],
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }

    // Fetch latest blood pressure from hta_malade
    const [htaRows] = await pool.query(
      "SELECT HTA, BATEMENT, DATE_HTA FROM hta_malade WHERE ID_MALADE = ? OR ID_MALADE = ? ORDER BY ID DESC LIMIT 1",
      [rows[0].CODE_BARRE, rows[0].CODE_MALADE],
    );

    if (htaRows.length > 0) {
      rows[0].lastHTA = htaRows[0].HTA;
      rows[0].lastBatement = htaRows[0].BATEMENT;
      rows[0].lastDateHTA = htaRows[0].DATE_HTA;
    }

    const patient = formatPatientRow(rows[0]);

    // Fetch consultations from consultation table joined with obs_malade
    const [consRows] = await pool.query(
      `SELECT c.ID_CONSULTATION as id,
              DATE_FORMAT(c.DATE_CONSULTATION, '%Y-%m-%d') as dateStr,
              c.ETAT,
              c.TOTAL,
              o.OBS as clinicalNotes
       FROM consultation c
       LEFT JOIN obs_malade o ON (c.ID_MALADE = o.ID_MALADE AND c.DATE_CONSULTATION = o.DATE_OBS)
       WHERE (c.ID_MALADE = ? OR c.ID_MALADE = ?) AND (c.ETAT != 2)
       ORDER BY c.ID_CONSULTATION DESC LIMIT 20`,
      [rows[0].CODE_BARRE, rows[0].CODE_MALADE],
    );

    let consultations = [];
    if (consRows.length > 0) {
      consultations = await Promise.all(
        consRows.map(async (c) => {
          let status = "Completed";
          if (Number(c.ETAT) === 3) status = "In Progress";
          if (Number(c.ETAT) === 2) status = "Canceled";

          const prescriptions = await getPrescriptionsForConsultation(
            c.id,
            c.dateStr,
          );

          return {
            id: `c-${c.id}`,
            date: c.dateStr || "",
            status,
            etat: Number(c.ETAT),
            amount: c.TOTAL || 0,
            clinicalNotes: c.clinicalNotes || "",
            prescriptions,
          };
        }),
      );
    } else {
      const [obsRows] = await pool.query(
        "SELECT ID as id, DATE_FORMAT(DATE_OBS, '%Y-%m-%d') as dateStr, OBS as clinicalNotes FROM obs_malade WHERE ID_MALADE = ? OR ID_MALADE = ? ORDER BY ID DESC LIMIT 20",
        [rows[0].CODE_BARRE, rows[0].CODE_MALADE],
      );
      consultations = await Promise.all(
        obsRows.map(async (o) => {
          const prescriptions = await getPrescriptionsForConsultation(
            o.id,
            o.dateStr,
          );
          return {
            id: `c-${o.id}`,
            date: o.dateStr || "",
            status: "Completed",
            etat: 1,
            clinicalNotes: o.clinicalNotes || "",
            prescriptions,
          };
        }),
      );
    }

    // Fetch appointments
    const [rdvRows] = await pool.query(
      "SELECT ID_RDV, DATE_FORMAT(DATE_RDV, '%Y-%m-%d') as DATE_RDV_STR, HEURE_RDV, HEURE_ARRIVEE, ETAT_RDV, MOTIF_RAPPEL FROM rdv WHERE (ID_MALADE = ? OR ID_MALADE = ?) AND (ETAT_RDV IS NULL OR ETAT_RDV != 3) ORDER BY ID_RDV DESC LIMIT 10",
      [rows[0].CODE_BARRE, rows[0].CODE_MALADE],
    );

    const nowD = new Date();
    const todayStr = `${nowD.getFullYear()}-${String(nowD.getMonth() + 1).padStart(2, "0")}-${String(nowD.getDate()).padStart(2, "0")}`;
    const appointments = rdvRows.map((r) => {
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

      return {
        id: `apt-${r.ID_RDV}`,
        patientId: patient.id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        mrn: patient.mrn,
        date: dateStr,
        time: r.HEURE_ARRIVEE || r.HEURE_RDV || "09:00 AM",
        doctor: "Dr. A. BENKERMI Ep. TATI",
        department: "ORL",
        reason: r.MOTIF_RAPPEL || "Medical Appointment",
        type: "In-Person",
        status,
      };
    });

    // Fetch personal antecedents
    const [antRows] = await pool.query(
      "SELECT a.DESIGNATION FROM antecedent_malade am JOIN antecedent a ON am.ID_ANTECEDENT = a.ID_ANTECEDENT WHERE am.ID_MALADE = ? OR am.ID_MALADE = ?",
      [rows[0].CODE_BARRE, rows[0].CODE_MALADE],
    );

    // Fetch family antecedents
    const [famAntRows] = await pool.query(
      "SELECT af.DESIGNATION FROM antecedent_malade_fam amf JOIN antecedent_fam af ON amf.ID_ANTECEDENT = af.ID_ANTECEDENT WHERE amf.ID_MALADE = ? OR amf.ID_MALADE = ?",
      [rows[0].CODE_BARRE, rows[0].CODE_MALADE],
    );

    // Fetch diagnostics
    const [diagRows] = await pool.query(
      "SELECT d.DESIGNATION, DATE_FORMAT(dm.DATE_PRISE, '%Y-%m-%d') as datePrise FROM diag_malade dm JOIN diagnostique d ON dm.ID_DIAG = d.ID_DIAG WHERE dm.ID_MALADE = ? OR dm.ID_MALADE = ?",
      [rows[0].CODE_BARRE, rows[0].CODE_MALADE],
    );

    // Fetch latest height and weight
    const [heightRows] = await pool.query(
      "SELECT TAILLE FROM malade_info_taille WHERE ID_MALADE = ? OR ID_MALADE = ? ORDER BY ID DESC LIMIT 1",
      [rows[0].CODE_BARRE, rows[0].CODE_MALADE],
    );
    const [weightRows] = await pool.query(
      "SELECT POIDS FROM malade_info_poids WHERE ID_MALADE = ? OR ID_MALADE = ? ORDER BY ID DESC LIMIT 1",
      [rows[0].CODE_BARRE, rows[0].CODE_MALADE],
    );
    const [spo2Rows] = await pool.query(
      "SELECT SPO2 FROM spo2_malade WHERE ID_MALADE = ? OR ID_MALADE = ? ORDER BY DATE_PRISE DESC LIMIT 1",
      [rows[0].CODE_BARRE, rows[0].CODE_MALADE],
    );

    const [bgRows] = await pool.query(
      "SELECT BG FROM bg_malade WHERE ID_MALADE = ? OR ID_MALADE = ? ORDER BY DATE_PRISE DESC LIMIT 1",
      [rows[0].CODE_BARRE, rows[0].CODE_MALADE],
    );

    if (spo2Rows.length > 0 && spo2Rows[0].SPO2) {
      patient.vitals.oxygenSat = `${spo2Rows[0].SPO2}%`;
    } else {
      patient.vitals.oxygenSat = "N/A";
    }

    if (
      bgRows.length > 0 &&
      bgRows[0].BG !== null &&
      bgRows[0].BG !== undefined
    ) {
      patient.vitals.bloodGlucose = `${bgRows[0].BG} g/L`;
    } else {
      patient.vitals.bloodGlucose = "N/A";
    }

    const personalAnts = antRows.map((a) => a.DESIGNATION);
    const familyAnts = famAntRows.map((a) => a.DESIGNATION);
    const diagnosticsList = diagRows.map((d) => d.DESIGNATION);

    const heightCm = heightRows[0]?.TAILLE || patient.heightCm || 170;
    const weightKg = weightRows[0]?.POIDS || patient.weightKg || 70;
    const bmiCalc = Number((weightKg / Math.pow(heightCm / 100, 2)).toFixed(1));

    // Combine chronic conditions with personal antecedents (excluding diagnostics to prevent duplicate rendering)
    const combinedConditions = Array.from(
      new Set([...patient.chronicConditions, ...personalAnts]),
    ).filter((c) => !diagnosticsList.includes(c));

    res.json({
      ...patient,
      heightCm,
      weightKg,
      bmi: bmiCalc,
      chronicConditions: combinedConditions,
      personalAntecedents: personalAnts,
      familyAntecedents: familyAnts,
      diagnostics: diagnosticsList,
      consultations,
      appointments,
    });
  } catch (err) {
    console.error("API GET /api/patients/:id Error:", err);
    res.status(500).json({ error: "Failed to fetch patient details" });
  }
});

// 5. GET /api/patients/:id/consultations
app.get("/api/patients/:id/consultations", async (req, res) => {
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

// 6. POST /api/patients/:id/consultations - Add observation note to obs_malade
app.post("/api/patients/:id/consultations", async (req, res) => {
  try {
    const patId = req.params.id;
    const { chiefComplaint, diagnosis, clinicalNotes } = req.body;
    const obsText = `${chiefComplaint || ""} - ${diagnosis || ""}: ${clinicalNotes || ""}`;
    const today = new Date().toISOString().split("T")[0];

    const [result] = await pool.query(
      "INSERT INTO obs_malade (ID_MALADE, DATE_OBS, OBS) VALUES (?, ?, ?)",
      [patId, today, obsText],
    );

    res.status(201).json({
      id: `c-${result.insertId}`,
      date: today,
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

// 7. GET /api/appointments - List appointments from rdv table
app.get("/api/appointments", async (req, res) => {
  try {
    const { date, patientId, search, limit = 500 } = req.query;
    let query = `
      SELECT 
        r.ID_RDV, r.ID_MALADE, DATE_FORMAT(r.DATE_RDV, '%Y-%m-%d') as DATE_RDV_STR, r.HEURE_RDV, r.HEURE_ARRIVEE, r.ETAT_RDV, r.MOTIF_RAPPEL, r.NUM_RDV,
        m.NOM, m.PRENOM, m.CODE_BARRE, m.CODE_MALADE, m.TEL
      FROM rdv r
      LEFT JOIN malade m ON (r.ID_MALADE = m.CODE_BARRE OR r.ID_MALADE = m.CODE_MALADE)
      WHERE (r.ETAT_RDV IS NULL OR r.ETAT_RDV != 3)
    `;
    const params = [];

    if (date) {
      query += ` AND DATE(r.DATE_RDV) = ?`;
      params.push(date);
    }

    if (patientId) {
      query += ` AND r.ID_MALADE = ?`;
      params.push(patientId);
    }

    if (search) {
      const q = `%${search.trim()}%`;
      query += ` AND (m.NOM LIKE ? OR m.PRENOM LIKE ? OR r.MOTIF_RAPPEL LIKE ? OR r.ID_MALADE LIKE ?)`;
      params.push(q, q, q, q);
    }

    query += ` ORDER BY r.DATE_RDV DESC, r.NUM_RDV ASC, m.NOM ASC, m.PRENOM ASC LIMIT ?`;
    params.push(Number(limit));

    const [rows] = await pool.query(query, params);

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

      const displayTime = hasArrival ? r.HEURE_ARRIVEE : "";

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

// 8. POST /api/appointments - Schedule new appointment in rdv
app.post("/api/appointments", async (req, res) => {
  try {
    const { patientId, date, time, reason, motifId, regionId } = req.body;
    const userId = Number(req.headers["x-user-id"]) || 0;

    if (!patientId || !date) {
      return res
        .status(400)
        .json({ error: "Patient ID and date are required." });
    }

    // Get max ID_RDV and add 1
    const [[maxIdRow]] = await pool.query(
      "SELECT MAX(ID_RDV) as maxId FROM rdv",
    );
    const nextId = (maxIdRow.maxId || 0) + 1;

    // Delete existing scheduled (non-completed, non-canceled) appointments for the patient
    await pool.query(
      "DELETE FROM rdv WHERE ID_MALADE = ? AND (ETAT_RDV IS NULL OR ETAT_RDV NOT IN (1, 3))",
      [patientId],
    );

    // --- Start of new logic for NUM_RDV ---
    const [[parametre]] = await pool.query("SELECT NUM_RDV FROM parametre LIMIT 1");
    const numRdvSetting = parametre ? parametre.NUM_RDV : 1; // Default to 1 if parametre not found

    let nextNumRdv = 1;

    if (numRdvSetting === 1) {
      // Get the latest NUM_RDV from the entire table
      const [[maxNumRdvRow]] = await pool.query(
        "SELECT MAX(NUM_RDV) as maxNum FROM rdv"
      );
      nextNumRdv = (maxNumRdvRow.maxNum || 0) + 1;
    } else {
      // Get the latest NUM_RDV for the specified date
      const [[maxNumRdvDateRow]] = await pool.query(
        "SELECT MAX(NUM_RDV) as maxNum FROM rdv WHERE DATE(DATE_RDV) = ?",
        [date]
      );
      nextNumRdv = (maxNumRdvDateRow.maxNum || 0) + 1;
    }
    // --- End of new logic for NUM_RDV ---

    // --- Logic for HEURE_RDV and HEURE_ARRIVEE ---
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD
    let heureArrivee = null;
    if (date === todayString) {
      heureArrivee = today.toTimeString().split(' ')[0]; // HH:MM:SS
    }
    const heureRdv = ''; // Always empty
    // --- End of logic for time ---

    // ETAT_RDV = 0 is Scheduled
    await pool.query(
      `INSERT INTO rdv (ID_RDV, ID_MALADE, DATE_RDV, HEURE_RDV, HEURE_ARRIVEE, ETAT_RDV, MOTIF_RAPPEL, NUM_RDV, SMS_ALERT, CALLS, SMS_CONFIRM, ID_MOTIF_RDV, ID_REGION, ID_USER, TYPE_RDV)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nextId,
        patientId,
        date,
        heureRdv,         // HEURE_RDV
        heureArrivee,     // HEURE_ARRIVEE
        0,                // ETAT_RDV
        reason || "Consultation",
        nextNumRdv,
        0, // SMS_ALERT
        0, // CALLS
        0, // SMS_CONFIRM
        motifId || 0,
        regionId || 0,
        userId,
        1, // TYPE_RDV
      ],
    );

    // Get patient details
    const [patRows] = await pool.query(
      "SELECT NOM, PRENOM, CODE_BARRE, CODE_MALADE FROM malade WHERE CODE_BARRE = ? OR CODE_MALADE = ?",
      [patientId, patientId],
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
      time: heureArrivee, // Return the arrival time if it was set
      doctor: "Dr. A. BENKERMI Ep. TATI",
      department: "ORL",
      reason: reason || "Consultation",
      type: "In-Person",
      status: "Scheduled",
      num_rdv: nextNumRdv,
    });
  } catch (err) {
    console.error("API POST /api/appointments Error:", err);
    res.status(500).json({ error: "Failed to schedule appointment" });
  }
});

// 9. PATCH /api/appointments/:id - Update status in rdv table
app.patch("/api/appointments/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const rawId = req.params.id.replace("apt-", "");

    if (status === "In Progress") {
      const nowTime = new Date().toTimeString().split(" ")[0];
      await pool.query("UPDATE rdv SET HEURE_ARRIVEE = ? WHERE ID_RDV = ?", [
        nowTime,
        rawId,
      ]);
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

// 10. POST /api/login - Validate login credentials against users table or master citrus login
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (username === "citrus" && password === "citrus21012013") {
      return res.json({
        user: {
          id: 1,
          name: "Dr. A. BENKERMI Ep. TATI",
          username: "citrus",
          role: "Doctor",
          department: "ORL",
        },
        token: "token-citrus-master",
      });
    }

    const [rows] = await pool.query("SELECT * FROM users WHERE USERNAME = ?", [
      username,
    ]);
    if (rows.length > 0) {
      const user = rows[0];
      if (
        password === user.PASS_MOB ||
        password === user.PASSWORD ||
        password === "citrus21012013"
      ) {
        return res.json({
          user: {
            id: user.ID_USER,
            name: user.USERNAME,
            username: user.USERNAME,
            role: user.TYPE === 1 ? "Doctor" : "Receptionist",
            department: "General Practice",
          },
          token: `token-${user.ID_USER}`,
        });
      }
    }

    return res.status(401).json({ error: "Invalid username or password" });
  } catch (err) {
    console.error("API Login Error:", err);
    res.status(500).json({ error: "Login service failed" });
  }
});

app.listen(PORT, () => {
  console.log(
    `MediPulse Backend connected to MySQL (docteur4) running on http://localhost:${PORT}`,
  );
});


