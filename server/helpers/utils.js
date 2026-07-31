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
              d.DOSAGE as dosage,
              d.FREQUENCE as frequency,
              d.QTE as duration,
              m.DESIGNATION as standardName,
              mp.PRESCRIPTION as customPrescription
       FROM ${tableName} d
       LEFT JOIN medicament m ON (d.TYPE = 1 OR d.TYPE IS NULL OR d.TYPE = 0) AND d.ID_MEDICAMENT = m.ID_MEDICAMENT
       LEFT JOIN medicament_p mp ON d.TYPE = 2 AND d.ID_MEDICAMENT = mp.ID_MEDICAMENT
       WHERE d.ID_CONSULTATION = ?`,
      [idConsultation],
    );

    return rows.map((r) => {
      const isType2 = Number(r.type) === 2;
      return {
        type: isType2 ? 2 : 1,
        name: isType2 ? (r.customPrescription || "Prescription") : (r.standardName || "Médicament"),
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
