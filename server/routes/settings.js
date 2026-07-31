import express from "express";
import pool from "../db.js";
import { requireExistingUser } from "../middleware/auth.js";
import {
  CONSULTATION_OPTION_FIELDS,
  normalizeConsultationOption,
  normalizeRadioOption,
  normalizeCheckboxOption,
  normalizeHoraireRow,
} from "../helpers/utils.js";

const router = express.Router();

// GET /api/clinic - Clinic parameters metadata from parametre and param_consult tables
router.get("/clinic", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM parametre LIMIT 1");
    const [consultRows] = await pool.query(
      "SELECT * FROM param_consult LIMIT 1"
    );
    const [infoSuppRows] = await pool.query(
      "SELECT * FROM param_info_supp LIMIT 1"
    ).catch(() => [[]]);

    if (rows.length > 0) {
      const p = rows[0];
      const consultationOptions = consultRows[0] || {};
      const infoSupp = infoSuppRows[0] || {};
      res.json({
        raw: p,
        paramInfoSupp: {
          OBS: Number(infoSupp.OBS ?? 1),
          ANT: Number(infoSupp.ANT ?? 1),
          TA: Number(infoSupp.TA ?? 1),
          TAILLE: Number(infoSupp.TAILLE ?? 1),
          POIDS: Number(infoSupp.POIDS ?? 1),
          PC: Number(infoSupp.PC ?? 1),
          ALIMENTATION: Number(infoSupp.ALIMENTATION ?? 1),
          DDR: Number(infoSupp.DDR ?? 1),
          DIAG_CONS: Number(infoSupp.DIAG_CONS ?? 1),
          DIAG_G: Number(infoSupp.DIAG_G ?? 1),
        },
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

// PUT /api/clinic - Update clinic parameters in parametre and param_consult tables
router.put("/clinic", async (req, res) => {
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

    const [rows] = await pool.query("SELECT ID_PARAMETRE FROM parametre LIMIT 1");
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
        ]
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
        ]
      );
    }

    const consultationOptions = CONSULTATION_OPTION_FIELDS.map((field) =>
      normalizeConsultationOption(req.body[field])
    );
    const [consultRows] = await pool.query(
      "SELECT ID FROM param_consult ORDER BY ID LIMIT 1"
    );

    if (consultRows.length > 0) {
      await pool.query(
        `UPDATE param_consult SET
          ORD = ?, CERT_MEDIC = ?, BILAN = ?, LET_OR = ?, ARRET_TRAV = ?, MOTIF = ?`,
        consultationOptions
      );
    } else {
      await pool.query(
        `INSERT INTO param_consult (ORD, CERT_MEDIC, BILAN, LET_OR, ARRET_TRAV, MOTIF, EXPLOR)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        consultationOptions
      );
    }

    if (req.body.paramInfoSupp) {
      const { OBS, ANT, TA, TAILLE, POIDS, PC, ALIMENTATION, DDR, DIAG_CONS, DIAG_G } = req.body.paramInfoSupp;
      const [infoSuppCheck] = await pool.query("SELECT ID FROM param_info_supp ORDER BY ID LIMIT 1").catch(() => [[]]);
      if (infoSuppCheck && infoSuppCheck.length > 0) {
        await pool.query(
          `UPDATE param_info_supp SET
            OBS = ?, ANT = ?, TA = ?, TAILLE = ?, POIDS = ?, PC = ?, ALIMENTATION = ?, DDR = ?, DIAG_CONS = ?, DIAG_G = ?
           WHERE ID = ?`,
          [
            OBS ?? 1, ANT ?? 1, TA ?? 1, TAILLE ?? 1, POIDS ?? 1, PC ?? 1, ALIMENTATION ?? 1, DDR ?? 1, DIAG_CONS ?? 1, DIAG_G ?? 1,
            infoSuppCheck[0].ID
          ]
        ).catch(e => console.error("Error updating param_info_supp:", e));
      } else {
        await pool.query(
          `INSERT INTO param_info_supp (OBS, ANT, TA, TAILLE, POIDS, PC, ALIMENTATION, DDR, DIAG_CONS, DIAG_G)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            OBS ?? 1, ANT ?? 1, TA ?? 1, TAILLE ?? 1, POIDS ?? 1, PC ?? 1, ALIMENTATION ?? 1, DDR ?? 1, DIAG_CONS ?? 1, DIAG_G ?? 1
          ]
        ).catch(e => console.error("Error inserting param_info_supp:", e));
      }
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

// GET /api/horaire - Working hours table
router.get("/horaire", async (req, res) => {
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
       ) ASC`
    );
    res.json(rows.map(normalizeHoraireRow));
  } catch (err) {
    console.error("API /api/horaire Error:", err);
    res.status(500).json({ error: "Failed to fetch horaire table" });
  }
});

// PUT /api/horaire - Update a row in horaire
router.put("/horaire", requireExistingUser, async (req, res) => {
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
      ]
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

// GET /api/users - Minimal user list for settings
router.get("/users", requireExistingUser, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ID_USER, USERNAME, PASS_MOB, TYPE
       FROM users
       ORDER BY ID_USER ASC`
    );

    res.json(
      rows.map((row) => ({
        id: row.ID_USER,
        username: row.USERNAME ?? "",
        password: row.PASS_MOB ?? "",
        type: Number(row.TYPE) === 1 ? 1 : 0,
      }))
    );
  } catch (err) {
    console.error("API /api/users Error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.post("/users", requireExistingUser, async (req, res) => {
  try {
    const { username, password, type } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const nextType = Number(type) === 1 ? 1 : 0;
    const [result] = await pool.query(
      `INSERT INTO users (USERNAME, PASSWORD, PASS_MOB, TYPE, FONCTION)
       VALUES (?, ?, ?, ?, ?)`,
      [username, password, password, nextType, nextType]
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

router.put("/users/:id", requireExistingUser, async (req, res) => {
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
      [username, password, password, nextType, nextType, id]
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

router.delete("/users/:id", requireExistingUser, async (req, res) => {
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

// GET /api/printers
router.get("/printers", (req, res) => {
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
router.get("/motif_rdv", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM motif_rdv ORDER BY DESIGNATION ASC");
    res.json(rows);
  } catch (err) {
    console.error("API /api/motif_rdv GET Error:", err);
    res.status(500).json({ error: "Failed to fetch appointment reasons" });
  }
});

router.post("/motif_rdv", async (req, res) => {
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

router.put("/motif_rdv/:id", async (req, res) => {
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

router.delete("/motif_rdv/:id", async (req, res) => {
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
router.get("/region", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM region ORDER BY DESIGNATION ASC");
    res.json(rows);
  } catch (err) {
    console.error("API /api/region GET Error:", err);
    res.status(500).json({ error: "Failed to fetch regions" });
  }
});

router.post("/region", async (req, res) => {
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

router.put("/region/:id", async (req, res) => {
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

router.delete("/region/:id", async (req, res) => {
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

export default router;
