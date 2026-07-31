import express from "express";
import pool from "../db.js";
import {
  formatPatientRow,
  parseGS,
  generer_Code_Malade,
  getPrescriptionsForConsultation,
} from "../helpers/utils.js";

const router = express.Router();

// GET /api/patients - List patients from MySQL
router.get("/", async (req, res) => {
  try {
    const { search, status, gender, bloodGroup, limit = 60 } = req.query;
    let query = `
      SELECT m.*
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

    // Fetch patient allergies from db table allergie_malade & allergie
    if (result.length > 0) {
      const codeBarres = rows.map(r => r.CODE_BARRE).filter(Boolean);
      const codeMalades = rows.map(r => r.CODE_MALADE).filter(Boolean);
      const allIds = Array.from(new Set([...codeBarres, ...codeMalades]));

      if (allIds.length > 0) {
        try {
          const [allAllergies] = await pool.query(
            `SELECT am.ID_MALADE, a.ID_ALLERGIE, a.DESIGNATION
             FROM allergie_malade am
             JOIN allergie a ON am.ID_ALLERGIE = a.ID_ALLERGIE
             WHERE am.ID_MALADE IN (?)`,
            [allIds]
          );

          const allergyMap = {};
          allAllergies.forEach(r => {
            if (!allergyMap[r.ID_MALADE]) allergyMap[r.ID_MALADE] = [];
            if (r.DESIGNATION && r.DESIGNATION.trim()) {
              allergyMap[r.ID_MALADE].push(r.DESIGNATION.trim());
            }
          });

          result.forEach(p => {
            const list1 = allergyMap[p.codeBarre] || [];
            const list2 = allergyMap[p.mrn] || [];
            p.allergies = Array.from(new Set([...list1, ...list2]));
          });
        } catch (errAlg) {
          console.error("Error fetching allergies in /api/patients:", errAlg.message);
        }
      }
    }

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

// POST /api/patients - Register new patient in MySQL
router.post("/", async (req, res) => {
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

    // Check if patient already exists in database
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

// PUT /api/patients/:id - Update existing patient in MySQL
router.put("/:id", async (req, res) => {
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

// GET /api/patients/:id - Single patient details
router.get("/:id", async (req, res) => {
  try {
    const patId = req.params.id;
    const [rows] = await pool.query(
      "SELECT * FROM malade WHERE CODE_BARRE = ? OR CODE_MALADE = ?",
      [patId, patId],
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }

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

    try {
      const [allergyRows] = await pool.query(
        `SELECT a.ID_ALLERGIE, a.DESIGNATION
         FROM allergie_malade am
         JOIN allergie a ON am.ID_ALLERGIE = a.ID_ALLERGIE
         WHERE am.ID_MALADE = ? OR am.ID_MALADE = ?`,
        [rows[0].CODE_BARRE, rows[0].CODE_MALADE]
      );
      patient.allergies = allergyRows
        .map(r => (r.DESIGNATION ? r.DESIGNATION.trim() : ''))
        .filter(Boolean);
    } catch (eAlg) {
      console.error("Error fetching patient allergies in GET /api/patients/:id:", eAlg.message);
    }

    const [consRows] = await pool.query(
      `SELECT c.ID_CONSULTATION as id,
              c.EXERCICE,
              DATE_FORMAT(c.DATE_CONSULTATION, '%Y-%m-%d') as dateStr,
              c.ETAT,
              c.TOTAL,
              o.OBS as clinicalNotes,
              a.NB_JOUR as arretNbJour,
              a.NB_JOURS_L as arretNbJoursL,
              DATE_FORMAT(a.DATE_DEBUT, '%Y-%m-%d') as arretDateDebut,
              DATE_FORMAT(a.DATE_FIN, '%Y-%m-%d') as arretDateFin,
              a.OBS as arretObs
       FROM consultation c
       LEFT JOIN obs_malade o ON (c.ID_MALADE = o.ID_MALADE AND c.DATE_CONSULTATION = o.DATE_OBS)
       LEFT JOIN arret_consult a ON (c.ID_CONSULTATION = a.ID_CONSULTATION AND c.EXERCICE = a.EXERCICE)
       WHERE (c.ID_MALADE = ? OR c.ID_MALADE = ?) AND (c.ETAT != 2)
       GROUP BY c.ID_CONSULTATION, c.EXERCICE
       ORDER BY c.ID_CONSULTATION DESC LIMIT 50`,
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

          const hasArret = Boolean(c.arretNbJour || c.arretDateDebut);
          const arretDeTravail = hasArret ? {
            nbJour: c.arretNbJour || 0,
            nbJoursL: (c.arretNbJoursL || "").trim(),
            dateDebut: c.arretDateDebut || "",
            dateFin: c.arretDateFin || "",
            obs: c.arretObs || ""
          } : null;

          return {
            id: `c-${c.id}`,
            date: c.dateStr || "",
            status,
            etat: Number(c.ETAT),
            amount: c.TOTAL || 0,
            clinicalNotes: c.clinicalNotes || "",
            hasArretDeTravail: hasArret,
            arretDeTravail,
            prescriptions,
          };
        }),
      );
    } else {
      const [obsRows] = await pool.query(
        `SELECT o.ID as id,
                DATE_FORMAT(o.DATE_OBS, '%Y-%m-%d') as dateStr,
                o.OBS as clinicalNotes,
                a.NB_JOUR as arretNbJour,
                a.NB_JOURS_L as arretNbJoursL,
                DATE_FORMAT(a.DATE_DEBUT, '%Y-%m-%d') as arretDateDebut,
                DATE_FORMAT(a.DATE_FIN, '%Y-%m-%d') as arretDateFin,
                a.OBS as arretObs
         FROM obs_malade o
         LEFT JOIN arret_consult a ON (o.ID = a.ID_CONSULTATION)
         WHERE o.ID_MALADE = ? OR o.ID_MALADE = ?
         ORDER BY o.ID DESC LIMIT 50`,
        [rows[0].CODE_BARRE, rows[0].CODE_MALADE],
      );
      consultations = await Promise.all(
        obsRows.map(async (o) => {
          const prescriptions = await getPrescriptionsForConsultation(
            o.id,
            o.dateStr,
          );
          const hasArret = Boolean(o.arretNbJour || o.arretDateDebut);
          const arretDeTravail = hasArret ? {
            nbJour: o.arretNbJour || 0,
            nbJoursL: (o.arretNbJoursL || "").trim(),
            dateDebut: o.arretDateDebut || "",
            dateFin: o.arretDateFin || "",
            obs: o.arretObs || ""
          } : null;

          return {
            id: `c-${o.id}`,
            date: o.dateStr || "",
            status: "Completed",
            etat: 1,
            clinicalNotes: o.clinicalNotes || "",
            hasArretDeTravail: hasArret,
            arretDeTravail,
            prescriptions,
          };
        }),
      );
    }

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

    const [antRows] = await pool.query(
      "SELECT a.DESIGNATION FROM antecedent_malade am JOIN antecedent a ON am.ID_ANTECEDENT = a.ID_ANTECEDENT WHERE am.ID_MALADE = ? OR am.ID_MALADE = ?",
      [rows[0].CODE_BARRE, rows[0].CODE_MALADE],
    );

    const [famAntRows] = await pool.query(
      "SELECT af.DESIGNATION FROM antecedent_malade_fam amf JOIN antecedent_fam af ON amf.ID_ANTECEDENT = af.ID_ANTECEDENT WHERE amf.ID_MALADE = ? OR amf.ID_MALADE = ?",
      [rows[0].CODE_BARRE, rows[0].CODE_MALADE],
    );

    const [diagRows] = await pool.query(
      "SELECT d.DESIGNATION, DATE_FORMAT(dm.DATE_PRISE, '%Y-%m-%d') as datePrise FROM diag_malade dm JOIN diagnostique d ON dm.ID_DIAG = d.ID_DIAG WHERE dm.ID_MALADE = ? OR dm.ID_MALADE = ?",
      [rows[0].CODE_BARRE, rows[0].CODE_MALADE],
    );

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

// GET /api/patients/:id/consultations
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

// POST /api/patients/:id/observations - Add a new observation row
router.post("/:id/observations", async (req, res) => {
  try {
    const patId = req.params.id;
    const { observation, date } = req.body;
    if (!observation || !observation.trim()) {
      return res.status(400).json({ error: "Observation text is required" });
    }

    const obsDate = date || new Date().toISOString().split("T")[0];

    const [cols] = await pool.query("SHOW COLUMNS FROM obs_malade");
    const idCol = cols.find(c => c.Field === 'ID');
    const isAuto = idCol && idCol.Extra.includes('auto_increment');

    let sql, params;
    if (isAuto) {
      sql = "INSERT INTO obs_malade (ID_MALADE, DATE_OBS, OBS) VALUES (?, ?, ?)";
      params = [patId, obsDate, observation.trim()];
    } else {
      sql = "INSERT INTO obs_malade (ID, ID_MALADE, DATE_OBS, OBS) VALUES ((SELECT COALESCE(MAX(t.ID), 0) + 1 FROM obs_malade t), ?, ?, ?)";
      params = [patId, obsDate, observation.trim()];
    }

    const [result] = await pool.query(sql, params);
    const newId = isAuto ? result.insertId : null;

    res.status(201).json({
      success: true,
      id: newId,
      patientId: patId,
      date: obsDate,
      observation: observation.trim()
    });
  } catch (err) {
    console.error("API POST /api/patients/:id/observations Error:", err);
    res.status(500).json({ error: "Failed to add observation" });
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

// POST /api/patients/:id/consultations - Add observation note to obs_malade
router.post("/:id/consultations", async (req, res) => {
  try {
    const patId = req.params.id;
    const { chiefComplaint, diagnosis, clinicalNotes } = req.body;
    const obsText = `${chiefComplaint || ""} - ${diagnosis || ""}: ${clinicalNotes || ""}`;
    const today = new Date().toISOString().split("T")[0];

    const [cols] = await pool.query("SHOW COLUMNS FROM obs_malade");
    const idCol = cols.find(c => c.Field === 'ID');
    const isAuto = idCol && idCol.Extra.includes('auto_increment');

    let sql, params;
    if (isAuto) {
      sql = "INSERT INTO obs_malade (ID_MALADE, DATE_OBS, OBS) VALUES (?, ?, ?)";
      params = [patId, today, obsText];
    } else {
      sql = "INSERT INTO obs_malade (ID, ID_MALADE, DATE_OBS, OBS) VALUES ((SELECT COALESCE(MAX(t.ID), 0) + 1 FROM obs_malade t), ?, ?, ?)";
      params = [patId, today, obsText];
    }

    const [result] = await pool.query(sql, params);

    res.status(201).json({
      id: `c-${result.insertId || Date.now()}`,
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

export default router;
