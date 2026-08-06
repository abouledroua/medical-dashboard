import pool from "../db.js";

// Helper: Map Blood Group int from DB (1=A+, 2=A-, 3=B+, 4=B-, 5=AB+, 6=AB-, 7=O+, 8=O-, -1=None)
export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export function mapGS(gs) {
  const num = Number(gs);
  if (num >= 1 && num <= 8) {
    return BLOOD_GROUPS[num - 1];
  }
  return "";
}

export function parseGS(bloodGroupStr) {
  if (!bloodGroupStr) return -1;
  const idx = BLOOD_GROUPS.indexOf(bloodGroupStr);
  return idx !== -1 ? idx + 1 : -1;
}

export const CONSULTATION_OPTION_FIELDS = [
  "ORD",
  "CERT_MEDIC",
  "BILAN",
  "LET_OR",
  "ARRET_TRAV",
  "MOTIF",
];

export function normalizeConsultationOption(value) {
  return Number(value) === 1 ? 1 : 0;
}

export function normalizeRadioOption(value, defaultValue = 1) {
  return Number(value) || defaultValue;
}

export function normalizeCheckboxOption(value) {
  return Number(value) === 1 ? 1 : 0;
}

export function normalizeHoraireRow(row) {
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
export async function generer_Code_Malade(lastName, firstName) {
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
export function formatPatientRow(row) {
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
    generalDiagnosis: row.DIAGNOSTIQUE || "",
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
          ? String(row.lastBatement || row.BATEMENT).includes("bpm")
            ? `${row.lastBatement || row.BATEMENT}`
            : `${row.lastBatement || row.BATEMENT} bpm`
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

// Helper: Fetch prescriptions for a consultation across details_ordonnance_YYYY tables
export async function getPrescriptionsForConsultation(idConsultation, dateStr) {
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
      `SELECT d.TYPE as type,
              f.DESIGNATION as forme,
              d.DOSAGE as dosage,
              d.FREQUENCE as frequency,
              d.QTE as duration,
              m.DESIGNATION as standardName,
              mp.PRESCRIPTION as customPrescription
       FROM ${tableName} d
       LEFT JOIN medicament m ON (d.TYPE = 1 OR d.TYPE IS NULL OR d.TYPE = 0) AND d.ID_MEDICAMENT = m.ID_MEDICAMENT
       LEFT JOIN medicament_p mp ON d.TYPE = 2 AND d.ID_MEDICAMENT = mp.ID_MEDICAMENT
       LEFT JOIN forme f ON d.ID_FORME = f.ID_FORME
       WHERE d.ID_CONSULTATION = ?`,
      [idConsultation],
    );

    return rows.map((r) => {
      const isType2 = Number(r.type) === 2;
      return {
        type: isType2 ? 2 : 1,
        name: isType2 ? (r.customPrescription || "Prescription") : (r.standardName || "Médicament"),
        forme: isType2 ? "" : (r.forme || ""),
        dosage: isType2 ? "" : (r.dosage || ""),
        frequency: isType2 ? "" : (r.frequency || ""),
        duration: isType2 ? "" : (r.duration || ""),
      };
    });
  } catch (e) {
    console.error("getPrescriptionsForConsultation error:", e.message);
    return [];
  }
}

// Helper: Fetch Assuré info for a consultation from ordonnance_consult_YYYY table, fallback to obs JSON or patient row in malade table
export async function getAssureInfoForConsultation(idConsultation, dateStr, patientId, obsText = "") {
  try {
    let year = "";
    if (dateStr && String(dateStr).includes("-")) {
      year = String(dateStr).split("-")[0];
    }
    if (!year || isNaN(year)) {
      year = new Date().getFullYear();
    }

    // 1. Try parsing from obs JSON if available
    if (obsText && typeof obsText === "string" && obsText.includes("{")) {
      try {
        const jsonStr = obsText.substring(obsText.indexOf("{"));
        const parsed = JSON.parse(jsonStr);
        if (parsed && parsed.assureInfo && (parsed.assureInfo.fullname || parsed.assureInfo.infoSupp)) {
          return {
            fullname: String(parsed.assureInfo.fullname || ""),
            age: String(parsed.assureInfo.age || ""),
            typeAge: String(parsed.assureInfo.typeAge || "ans"),
            sexe: String(parsed.assureInfo.sexe || "M"),
            infoSupp: String(parsed.assureInfo.infoSupp || "")
          };
        }
      } catch (e) {}
    }

    // 2. Try fetching from ordonnance_consult_YYYY (or ordonnance_consult)
    const ordTable = `ordonnance_consult_${year}`;
    let targetTable = null;

    const [tCheck] = await pool.query("SHOW TABLES LIKE ?", [ordTable]);
    if (tCheck.length > 0) {
      targetTable = ordTable;
    } else {
      const [singleCheck] = await pool.query("SHOW TABLES LIKE 'ordonnance_consult'");
      if (singleCheck.length > 0) {
        targetTable = "ordonnance_consult";
      }
    }

    if (targetTable) {
      const [ordRows] = await pool.query(
        `SELECT * FROM \`${targetTable}\` WHERE ID_CONSULTATION = ? LIMIT 1`,
        [idConsultation]
      );
      if (ordRows.length > 0) {
        const ordRow = ordRows[0];
        const fullname = ordRow.FULLNAME || ordRow.NOM_PRENOM || ordRow.ASSURE || ordRow.NOM_ASSURE || ordRow.NOM_PRENOM_ASSURE || ordRow.FULLNAME_ASSURE || "";
        let age = ordRow.AGE_ASSURE !== undefined ? ordRow.AGE_ASSURE : (ordRow.AGE !== undefined ? ordRow.AGE : "");
        let typeAge = ordRow.TYPE_AGE || ordRow.TYPE_AGE_ASSURE || ordRow.TYPE_AGE_UNITE || ordRow.UNITE_AGE || "";
        if (!typeAge && ordRow.TYPE !== undefined) {
          const typeNum = Number(ordRow.TYPE);
          if (typeNum === 1) typeAge = "ans";
          else if (typeNum === 2) typeAge = "mois";
          else if (typeNum === 3) typeAge = "jours";
        }
        let sexe = ordRow.SEXE_ASSURE || ordRow.SEXE || ordRow.GENDER || "";
        if (typeof sexe === "number" || (!isNaN(sexe) && sexe !== "")) {
          const sNum = Number(sexe);
          sexe = sNum === 2 ? "F" : "M";
        }
        const infoSupp = ordRow.INFO_SUP || ordRow.INFO_SUPP || ordRow.INFORMATION_SUPPLEMENTAIRE || "";

        if (fullname || age || sexe || infoSupp) {
          return {
            fullname: String(fullname || ""),
            age: String(age || ""),
            typeAge: String(typeAge || "ans"),
            sexe: String(sexe || "M"),
            infoSupp: String(infoSupp || "")
          };
        }
      }
    }

    // 3. Fallback: Fetch default patient info from malade table
    if (patientId) {
      const [pRows] = await pool.query(
        "SELECT NOM, PRENOM, AGE, SEXE, TYPE FROM malade WHERE CODE_BARRE = ? OR CODE_MALADE = ? LIMIT 1",
        [patientId, patientId]
      );
      if (pRows.length > 0) {
        const p = pRows[0];
        const fullname = [p.NOM || p.nom, p.PRENOM || p.prenom].filter(Boolean).join(" ");
        const age = p.AGE !== undefined ? String(p.AGE) : "";
        let typeAge = "ans";
        const tNum = Number(p.TYPE);
        if (tNum === 2) typeAge = "mois";
        else if (tNum === 3) typeAge = "jours";
        const sexe = (p.SEXE || "M").toString().toUpperCase().startsWith("F") ? "F" : "M";
        return { fullname, age, typeAge, sexe, infoSupp: "" };
      }
    }

    return null;
  } catch (err) {
    console.error("getAssureInfoForConsultation error:", err.message);
    return null;
  }
}

export async function getBilansForConsultation(idConsultation, exercice) {
  try {
    const exStr = String(exercice || new Date().getFullYear());
    const [rows] = await pool.query(
      `SELECT DESIGNATION FROM (
        SELECT CONCAT_WS(', ',
          IF(BC.FNS = 1, 'FNS', NULL),
          IF(BC.GROUPAGE = 1, 'GROUPAGE', NULL),
          IF(BC.TP = 1, 'TP', NULL),
          IF(BC.FIBROGENE = 1, 'FIBROGENE', NULL),
          IF(BC.VS = 1, 'VS', NULL),
          IF(BC.FER = 1, 'FER', NULL),
          IF(BC.FERRITINE = 1, 'FERRITINE', NULL),
          IF(BC.GLYCEMIE = 1, 'GLYCEMIE', NULL),
          IF(BC.HBA1C = 1, 'HBA1C', NULL),
          IF(BC.SGOT = 1, 'SGOT', NULL),
          IF(BC.GAMMA = 1, 'GAMMA', NULL),
          IF(BC.BILIRUBINEMIE = 1, 'BILIRUBINEMIE', NULL),
          IF(BC.TOTALE = 1, 'TOTALE', NULL),
          IF(BC.CONJUGE = 1, 'CONJUGE', NULL),
          IF(BC.NONCONJUGE = 1, 'NONCONJUGE', NULL),
          IF(BC.UREE = 1, 'UREE', NULL),
          IF(BC.ECBU = 1, 'ECBU', NULL),
          IF(BC.CHOLESTEROL = 1, 'CHOLESTEROL', NULL),
          IF(BC.HDL = 1, 'HDL', NULL),
          IF(BC.LDL = 1, 'LDL', NULL),
          IF(BC.TRIGLYCERIDE = 1, 'TRIGLYCERIDE', NULL),
          IF(BC.KALIEMIE = 1, 'KALIEMIE', NULL),
          IF(BC.CALCEMIE = 1, 'CALCEMIE', NULL),
          IF(BC.RUBEOLE = 1, 'RUBEOLE', NULL),
          IF(BC.TOXOPLASMOSE = 1, 'TOXOPLASMOSE', NULL),
          IF(BC.SYPHIS = 1, 'SYPHIS', NULL),
          IF(BC.HIV = 1, 'HIV', NULL),
          IF(BC.URIQUE = 1, 'URIQUE', NULL),
          IF(BC.CRP = 1, 'CRP', NULL),
          IF(BC.ALBUMINEMIE = 1, 'ALBUMINEMIE', NULL),
          IF(BC.PROTEIN = 1, 'PROTEIN', NULL),
          IF(BC.PROTEIN24 = 1, 'PROTEIN24', NULL),
          IF(BC.FT3 = 1, 'FT3', NULL),
          IF(BC.FSH = 1, 'FSH', NULL),
          IF(BC.TSHUS = 1, 'TSHUS', NULL),
          IF(BC.LH = 1, 'LH', NULL),
          IF(BC.ASAT = 1, 'ASAT', NULL),
          IF(BC.PHOSPHATASES = 1, 'PHOSPHATASES', NULL),
          IF(BC.ASLO = 1, 'ASLO', NULL),
          IF(BC.PROLACTINE = 1, 'PROLACTINE', NULL),
          IF(BC.AMH = 1, 'AMH', NULL),
          IF(BC.PROGESTERONE = 1, 'PROGESTERONE', NULL),
          IF(BC.DHEA = 1, 'DHEA', NULL),
          IF(BC.DELTA = 1, 'DELTA', NULL),
          IF(BC.ETF = 1, 'ETF', NULL),
          IF(BC.EEG = 1, 'EEG', NULL),
          IF(BC.VIT_D = 1, 'VIT_D', NULL),
          IF(BC.ELETRO_HEMOG = 1, 'ELETRO_HEMOG', NULL),
          IF(BC.DOSAGE_DEPAKINE = 1, 'DOSAGE_DEPAKINE', NULL),
          IF(BC.RADIO_MAIN = 1, 'RADIO_MAIN', NULL),
          IF(BC.TELETHORAX = 1, 'TELETHORAX', NULL),
          IF(BC.COPRO_PARASIT = 1, 'COPRO_PARASIT', NULL),
          IF(BC.DOSAGE_HORM_CROISS = 1, 'DOSAGE_HORM_CROISS', NULL),
          IF(BC.SEROLOGIE_MALADIE_COELIAQUE = 1, 'SEROLOGIE_MALADIE_COELIAQUE', NULL),
          IF(BC.ACS = 1, 'ACS', NULL),
          IF(BC.ANTI_TRANSGLUT = 1, 'ANTI_TRANSGLUT', NULL),
          IF(BC.ANTIENDOM = 1, 'ANTIENDOM', NULL),
          IF(BC.ANTI_GLIADINE = 1, 'ANTI_GLIADINE', NULL),
          NULLIF(TRIM(BC.AUTRE), '')
        ) AS DESIGNATION
        FROM bilan_consult_coche BC
        WHERE BC.ID_CONSULTATION = ? AND BC.EXERCICE = ?

        UNION ALL

        SELECT COALESCE(NULLIF(TRIM(B.DESIGNATION), ''), NULLIF(TRIM(BSC.RESULTAT), '')) AS DESIGNATION
        FROM bilans_consult BSC
        LEFT JOIN bilan B ON B.ID_BILAN = BSC.ID_BILAN
        WHERE BSC.ID_CONSULTATION = ? AND BSC.EXERCICE = ?
      ) combined
      WHERE DESIGNATION IS NOT NULL AND TRIM(DESIGNATION) != ''`,
      [idConsultation, exStr, idConsultation, exStr]
    );

    return rows.map(r => r.DESIGNATION).filter(Boolean);
  } catch (err) {
    console.error("getBilansForConsultation error:", err.message);
    return [];
  }
}

