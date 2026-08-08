import express from "express";
import pool from "../../db.js";
import { getAssureInfoForConsultation } from "../../helpers/utils.js";
import {
  getOrCreateMedicationId,
  getOrCreateMedicamentPId,
  getOrCreateFormeId,
  getOrCreateDosageId,
  getOrCreateFrequenceId
} from "./consultationHelpers.js";

const router = express.Router();

// Helper 5: Ensure row in ordonnance_consult_YYYY header table when prescription is non-empty
async function ensureOrdonnanceConsultHeader(idConsultation, patientId, exercice, assureInfo = null) {
  const year = exercice || String(new Date().getFullYear());
  let targetTable = `ordonnance_consult_${year}`;

  const [tCheck] = await pool.query("SHOW TABLES LIKE ?", [targetTable]);
  if (tCheck.length === 0) {
    const [allOrdTables] = await pool.query("SHOW TABLES LIKE 'ordonnance_consult_%'");
    if (allOrdTables.length > 0) {
      const templateTable = Object.values(allOrdTables[0])[0];
      await pool.query(`CREATE TABLE IF NOT EXISTS \`${targetTable}\` LIKE \`${templateTable}\``);
    } else {
      const [singleCheck] = await pool.query("SHOW TABLES LIKE 'ordonnance_consult'");
      if (singleCheck.length > 0) {
        targetTable = "ordonnance_consult";
      } else {
        await pool.query(`CREATE TABLE IF NOT EXISTS \`${targetTable}\` (
          ID_CONSULTATION int NOT NULL,
          ID_MALADE varchar(50) DEFAULT NULL,
          DATE_ORDONNANCE datetime DEFAULT NULL,
          EXERCICE varchar(10) DEFAULT NULL,
          PRIMARY KEY (ID_CONSULTATION)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
      }
    }
  }

  try {
    const [cols] = await pool.query(`SHOW COLUMNS FROM \`${targetTable}\``);
    const hasExCol = cols.some(c => c.Field.toUpperCase() === 'EXERCICE');
    
    let existing;
    if (hasExCol) {
      [existing] = await pool.query(
        `SELECT ID_CONSULTATION FROM \`${targetTable}\` WHERE ID_CONSULTATION = ? AND EXERCICE = ? LIMIT 1`,
        [idConsultation, String(year)]
      );
    } else {
      [existing] = await pool.query(
        `SELECT ID_CONSULTATION FROM \`${targetTable}\` WHERE ID_CONSULTATION = ? LIMIT 1`,
        [idConsultation]
      );
    }

    // Fetch patient info as fallback if assureInfo not provided
    let patientInfo = {};
    if (!assureInfo || !assureInfo.fullname) {
      const [pRows] = await pool.query(
        "SELECT NOM, PRENOM, AGE, SEXE, DATE_NAISSANCE, CODE_BARRE, CODE_MALADE FROM malade WHERE CODE_BARRE = ? OR CODE_MALADE = ? LIMIT 1",
        [patientId, patientId]
      );
      if (pRows.length > 0) {
        patientInfo = pRows[0];
      }
    }

    const fullnameVal = assureInfo?.fullname || [patientInfo.NOM || patientInfo.nom, patientInfo.PRENOM || patientInfo.prenom].filter(Boolean).join(' ') || '';
    const ageVal = assureInfo?.age !== undefined && assureInfo?.age !== '' ? assureInfo.age : (patientInfo.AGE !== undefined ? patientInfo.AGE : 0);
    const typeAgeVal = assureInfo?.typeAge || 'ans';
    const sexeVal = assureInfo?.sexe || patientInfo.SEXE || 'M';
    const infoSuppVal = assureInfo?.infoSupp || assureInfo?.info_sup || assureInfo?.INFO_SUP || '';

    const rowData = {
      ID_CONSULTATION: idConsultation,
      ID_MALADE: String(patientId),
      DATE_ORDONNANCE: new Date(),
      EXERCICE: String(year),
      ID_ORDONNANCE: 1,

      // Dynamic Assuré column mappings for ordonnance_consult_YYYY
      FULLNAME: fullnameVal,
      NOM_PRENOM: fullnameVal,
      ASSURE: fullnameVal,
      NOM_ASSURE: fullnameVal,
      NOM_PRENOM_ASSURE: fullnameVal,
      FULLNAME_ASSURE: fullnameVal,

      AGE: ageVal,
      AGE_ASSURE: ageVal,
      AGE_MALADE: ageVal,

      TYPE: typeAgeVal,
      TYPE_AGE: typeAgeVal,
      TYPE_AGE_ASSURE: typeAgeVal,
      TYPE_AGE_UNITE: typeAgeVal,
      UNITE_AGE: typeAgeVal,

      SEXE: sexeVal,
      SEXE_ASSURE: sexeVal,
      GENDER: sexeVal,

      INFO_SUP: infoSuppVal,
      INFO_SUPP: infoSuppVal,
      INFORMATION_SUPPLEMENTAIRE: infoSuppVal
    };

    if (existing.length === 0) {
      const fields = [];
      const values = [];

      for (const c of cols) {
        const colName = c.Field;
        if (c.Extra.includes("auto_increment")) continue;

        if (rowData[colName] !== undefined) {
          fields.push(`\`${colName}\``);
          let val = rowData[colName];
          const colUpper = colName.toUpperCase();
          const isNumType = c.Type.includes("int") || c.Type.includes("decimal") || c.Type.includes("float");

          if ((colUpper.includes('SEXE') || colUpper.includes('GENDER')) && isNumType) {
            if (typeof val === 'string') {
              val = val.toUpperCase().startsWith('F') ? 2 : (val.toUpperCase().startsWith('M') ? 1 : 0);
            }
          } else if (colUpper === 'TYPE' && isNumType) {
            if (typeof val === 'string') {
              const vLower = val.toLowerCase();
              if (vLower === 'ans' || vLower === 'an' || vLower === 'years' || vLower === 'year') {
                val = 1;
              } else if (vLower === 'mois' || vLower === 'months' || vLower === 'month') {
                val = 2;
              } else if (vLower === 'jours' || vLower === 'jour' || vLower === 'days' || vLower === 'day') {
                val = 3;
              } else {
                val = parseInt(val, 10) || 1;
              }
            } else {
              val = Number(val) || 1;
            }
          } else if (colUpper.includes('AGE') && !colUpper.includes('TYPE') && isNumType) {
            val = parseInt(val, 10) || 0;
          }

          values.push(val);
        } else if (c.Null === "NO" && c.Default === null) {
          fields.push(`\`${colName}\``);
          if (colName.toUpperCase().includes("ORDONNANCE")) {
            values.push(1);
          } else if (colName.toUpperCase().startsWith("ID_") || c.Type.includes("int") || c.Type.includes("decimal") || c.Type.includes("float")) {
            values.push(0);
          } else {
            values.push("");
          }
        }
      }

      const fieldSql = fields.join(", ");
      const placeholderSql = fields.map(() => "?").join(", ");
      await pool.query(`INSERT INTO \`${targetTable}\` (${fieldSql}) VALUES (${placeholderSql})`, values);
    } else {
      // Update Assuré columns on existing header row
      const updateFields = [];
      const updateValues = [];

      for (const c of cols) {
        const colName = c.Field;
        if (c.Extra.includes("auto_increment")) continue;
        if (['ID_CONSULTATION', 'EXERCICE', 'DATE_ORDONNANCE'].includes(colName.toUpperCase())) continue;

        if (rowData[colName] !== undefined) {
          let val = rowData[colName];
          const colUpper = colName.toUpperCase();
          const isNumType = c.Type.includes("int") || c.Type.includes("decimal") || c.Type.includes("float");

          if ((colUpper.includes('SEXE') || colUpper.includes('GENDER')) && isNumType) {
            if (typeof val === 'string') {
              val = val.toUpperCase().startsWith('F') ? 2 : (val.toUpperCase().startsWith('M') ? 1 : 0);
            }
          } else if (colUpper === 'TYPE' && isNumType) {
            if (typeof val === 'string') {
              const vLower = val.toLowerCase();
              if (vLower === 'ans' || vLower === 'an' || vLower === 'years' || vLower === 'year') {
                val = 1;
              } else if (vLower === 'mois' || vLower === 'months' || vLower === 'month') {
                val = 2;
              } else if (vLower === 'jours' || vLower === 'jour' || vLower === 'days' || vLower === 'day') {
                val = 3;
              } else {
                val = parseInt(val, 10) || 1;
              }
            } else {
              val = Number(val) || 1;
            }
          } else if (colUpper.includes('AGE') && !colUpper.includes('TYPE') && isNumType) {
            val = parseInt(val, 10) || 0;
          }

          updateFields.push(`\`${colName}\` = ?`);
          updateValues.push(val);
        }
      }

      if (updateFields.length > 0) {
        updateValues.push(idConsultation);
        if (hasExCol) {
          updateValues.push(String(year));
          await pool.query(
            `UPDATE \`${targetTable}\` SET ${updateFields.join(", ")} WHERE ID_CONSULTATION = ? AND EXERCICE = ?`,
            updateValues
          );
        } else {
          await pool.query(
            `UPDATE \`${targetTable}\` SET ${updateFields.join(", ")} WHERE ID_CONSULTATION = ?`,
            updateValues
          );
        }
      }
    }
  } catch (err) {
    console.error(`Error ensuring header row in ${targetTable}:`, err.message);
  }
}

// Helper 6: Remove row from ordonnance_consult_YYYY header table when prescription table becomes empty
async function removeOrdonnanceConsultHeader(idConsultation, exercice) {
  const year = String(exercice || new Date().getFullYear());
  let targetTable = `ordonnance_consult_${year}`;

  const [tCheck] = await pool.query("SHOW TABLES LIKE ?", [targetTable]);
  if (tCheck.length === 0) {
    const [allOrdTables] = await pool.query("SHOW TABLES LIKE 'ordonnance_consult_%'");
    if (allOrdTables.length > 0) {
      targetTable = Object.values(allOrdTables[0])[0];
    }
  }

  try {
    await pool.query(`DELETE FROM \`${targetTable}\` WHERE ID_CONSULTATION = ? AND EXERCICE = ?`, [idConsultation, year]);
  } catch (err) {
    console.error(`Error deleting header row from ${targetTable}:`, err.message);
  }
}

// Helper 7: Ensure details_ordonnance_YYYY table exists before writing prescription items
async function ensureDetailsOrdonnanceTable(tableName) {
  const [tCheck] = await pool.query("SHOW TABLES LIKE ?", [tableName]);
  if (tCheck.length === 0) {
    const [allDetailsTables] = await pool.query("SHOW TABLES LIKE 'details_ordonnance_%'");
    if (allDetailsTables.length > 0) {
      const templateTable = Object.values(allDetailsTables[0])[0];
      await pool.query(`CREATE TABLE IF NOT EXISTS \`${tableName}\` LIKE \`${templateTable}\``);
    } else {
      await pool.query(`CREATE TABLE IF NOT EXISTS \`${tableName}\` (
        ID_CONSULTATION int NOT NULL,
        ID_MEDICAMENT int NOT NULL,
        TYPE int DEFAULT 1,
        DOSAGE varchar(255) DEFAULT '',
        FREQUENCE varchar(255) DEFAULT '',
        QTE varchar(255) DEFAULT ''
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
    }
  }
}

// GET /api/patients/:id/consultations - Basic consultations query
router.get("/:id/consultations", async (req, res) => {
  try {
    const patId = req.params.id;
    const [obsRows] = await pool.query(
      "SELECT ID as id, DATE_OBS as date, OBS as clinicalNotes FROM obs_malade WHERE ID_MALADE = ? ORDER BY ID DESC LIMIT 20",
      [patId],
    );

    const consultations = await Promise.all(obsRows.map(async (o) => {
      const dateStr = o.date
        ? new Date(o.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];
      const assureInfo = await getAssureInfoForConsultation(o.id, dateStr, patId, o.clinicalNotes);

      return {
        id: `c-${o.id}`,
        date: dateStr,
        time: "10:00 AM",
        doctor: "Médecin",
        department: "ORL",
        chiefComplaint: "Medical Follow-up",
        diagnosis: o.clinicalNotes || "Observation",
        clinicalNotes: o.clinicalNotes || "Routine consultation completed.",
        prescriptions: [],
        assureInfo,
        vitalsAtVisit: "BP: 120/80 | HR: 72 | SpO2: 98%",
      };
    }));

    res.json(consultations);
  } catch (err) {
    console.error("API consultations Error:", err);
    res.status(500).json({ error: "Failed to fetch consultations" });
  }
});

// GET /api/patients/:id/bilan-coche - Get checked bilans history from bilan_consult_coche table
router.get("/:id/bilan-coche", async (req, res) => {
  try {
    const patId = req.params.id;
    const [patRows] = await pool.query(
      "SELECT CODE_BARRE, CODE_MALADE FROM malade WHERE CODE_BARRE = ? OR CODE_MALADE = ?",
      [patId, patId]
    ).catch(() => [[]]);

    const ids = [];
    if (patRows.length > 0) {
      if (patRows[0].CODE_BARRE) ids.push(patRows[0].CODE_BARRE);
      if (patRows[0].CODE_MALADE) ids.push(patRows[0].CODE_MALADE);
    }
    if (ids.length === 0) ids.push(patId);

    const query = `
      SELECT ID_CONSULTATION, EXERCICE, DATE_BILAN, DESIGNATION FROM (
        SELECT BC.ID_CONSULTATION, BC.EXERCICE, BC.DATE_BILAN AS DATE_BILAN,
          c.DATE_CONSULTATION,
          CONCAT(
            CASE BC.FNS WHEN 1 THEN 'FNS, ' ELSE '' END,
            CASE BC.GROUPAGE WHEN 1 THEN 'Groupage Sanguin, ' ELSE '' END,
            CASE BC.TP WHEN 1 THEN 'TP-TCK, ' ELSE '' END,
            CASE BC.FIBROGENE WHEN 1 THEN 'Taux de Fibrogène, ' ELSE '' END,
            CASE BC.VS WHEN 1 THEN 'VS, ' ELSE '' END,
            CASE BC.FER WHEN 1 THEN 'Fer Sérique, ' ELSE '' END,
            CASE BC.FERRITINE WHEN 1 THEN 'Ferritine, ' ELSE '' END,
            CASE BC.GLYCEMIE WHEN 1 THEN 'Glycemie à jeun, ' ELSE '' END,
            CASE BC.HBA1C WHEN 1 THEN 'HbA1C, ' ELSE '' END,
            CASE BC.SGOT WHEN 1 THEN 'SGOT - SGPT, ' ELSE '' END,
            CASE BC.GAMMA WHEN 1 THEN 'Gamma GT - Phosphates Alcalines, ' ELSE '' END,
            CASE BC.BILIRUBINEMIE WHEN 1 THEN CONCAT('Bilirubinémie',
              CASE BC.TOTALE WHEN 1 THEN CONCAT('\n','  ','Total') ELSE '' END,
              CASE BC.CONJUGE WHEN 1 THEN CONCAT('\n','  ','Conjugée') ELSE '' END,
              CASE BC.NONCONJUGE WHEN 1 THEN CONCAT('\n','  ','Non Conjugée') ELSE '' END, ', '
            ) ELSE '' END,
            CASE BC.UREE WHEN 1 THEN 'Urée - Créatinémie, ' ELSE '' END,
            CASE BC.ECBU WHEN 1 THEN 'ECBU, ' ELSE '' END,
            CASE BC.CHOLESTEROL WHEN 1 THEN 'Cholestérole Total, ' ELSE '' END,
            CASE BC.HDL WHEN 1 THEN 'HDL Cholestérol, ' ELSE '' END,
            CASE BC.LDL WHEN 1 THEN 'LDL Cholestérol, ' ELSE '' END,
            CASE BC.TRIGLYCERIDE WHEN 1 THEN 'Triglycéride, ' ELSE '' END,
            CASE BC.KALIEMIE WHEN 1 THEN 'Kaliémie - Natrémie, ' ELSE '' END,
            CASE BC.CALCEMIE WHEN 1 THEN 'Calcémie - Phosphosémie, ' ELSE '' END,
            CASE BC.RUBEOLE WHEN 1 THEN 'Sériologie de la Rubéole, ' ELSE '' END,
            CASE BC.TOXOPLASMOSE WHEN 1 THEN 'Sériologie de la Toxoplasmose, ' ELSE '' END,
            CASE BC.SYPHIS WHEN 1 THEN 'Sériologie de la Syphilis, ' ELSE '' END,
            CASE BC.HIV WHEN 1 THEN 'Sériologie HIV, ' ELSE '' END,
            CASE BC.URIQUE WHEN 1 THEN 'Taux d''acide Urique, ' ELSE '' END,
            CASE BC.CRP WHEN 1 THEN 'CRP, ' ELSE '' END,
            CASE BC.ALBUMINEMIE WHEN 1 THEN 'Albuminémie, ' ELSE '' END,
            CASE BC.PROTEIN WHEN 1 THEN 'Proteinurie, ' ELSE '' END,
            CASE BC.PROTEIN24 WHEN 1 THEN 'Proteinurie de 24h, ' ELSE '' END,
            CASE BC.FT3 WHEN 1 THEN 'FT 3 - FT 4, ' ELSE '' END,
            CASE BC.FSH WHEN 1 THEN 'FHS, ' ELSE '' END,
            CASE BC.TSHUS WHEN 1 THEN 'TSHus, ' ELSE '' END,
            CASE BC.LH WHEN 1 THEN 'LH, ' ELSE '' END,
            CASE BC.ASAT WHEN 1 THEN 'ASAT - ALAT, ' ELSE '' END,
            CASE BC.PHOSPHATASES WHEN 1 THEN 'Phosphatases Alcalines, ' ELSE '' END,
            CASE BC.ASLO WHEN 1 THEN 'ASLO, ' ELSE '' END,
            CASE BC.PROLACTINE WHEN 1 THEN 'Prolactine, ' ELSE '' END,
            CASE BC.AMH WHEN 1 THEN 'AMH, ' ELSE '' END,
            CASE BC.PROGESTERONE WHEN 1 THEN 'Progestérone, ' ELSE '' END,
            CASE BC.DHEA WHEN 1 THEN 'S - DHEA, ' ELSE '' END,
            CASE BC.DELTA WHEN 1 THEN 'Delta 4 androstenedione, ' ELSE '' END,
            CASE BC.ETF WHEN 1 THEN 'ETF, ' ELSE '' END,
            CASE BC.EEG WHEN 1 THEN 'EEG, ' ELSE '' END,
            CASE BC.VIT_D WHEN 1 THEN 'Dosage Vitamine D, ' ELSE '' END,
            CASE BC.ELETRO_HEMOG WHEN 1 THEN 'Electrophorese de l’hemoglobine, ' ELSE '' END,
            CASE BC.DOSAGE_DEPAKINE WHEN 1 THEN 'Dosage depakine, ' ELSE '' END,
            CASE BC.RADIO_MAIN WHEN 1 THEN 'Radio de la main, ' ELSE '' END,
            CASE BC.TELETHORAX WHEN 1 THEN 'Telethorax, ' ELSE '' END,
            CASE BC.COPRO_PARASIT WHEN 1 THEN 'Copro-parasitologie des sels, ' ELSE '' END,
            CASE BC.DOSAGE_HORM_CROISS WHEN 1 THEN 'Dosage de l’hormone de croissance, ' ELSE '' END,
            CASE BC.SEROLOGIE_MALADIE_COELIAQUE WHEN 1 THEN CONCAT('Sérologie de la maladie coeliaque',
              CASE BC.ACS WHEN 1 THEN CONCAT('\n','  ','ACS') ELSE '' END,
              CASE BC.ANTI_TRANSGLUT WHEN 1 THEN CONCAT('\n','  ','Anti-transglutaminase') ELSE '' END,
              CASE BC.ANTIENDOM WHEN 1 THEN CONCAT('\n','  ','Antiendomisum') ELSE '' END,
              CASE BC.ANTI_GLIADINE WHEN 1 THEN CONCAT('\n','  ','Anti gliadine') ELSE '' END, ', '
            ) ELSE '' END,
            REPLACE(IFNULL(BC.AUTRE, ''), ';', ', ')
          ) AS DESIGNATION
        FROM bilan_consult_coche BC
        INNER JOIN consultation c ON c.ID_CONSULTATION = BC.ID_CONSULTATION 
                                 AND c.EXERCICE = BC.EXERCICE 
                                 AND c.ETAT IN (1, 3)
        WHERE c.ID_MALADE IN (?)

        UNION ALL

        SELECT BSC.ID_CONSULTATION, BSC.EXERCICE, c.DATE_CONSULTATION AS DATE_BILAN,
          c.DATE_CONSULTATION,
          GROUP_CONCAT(COALESCE(b.DESIGNATION, BSC.RESULTAT) SEPARATOR ', ') AS DESIGNATION
        FROM bilans_consult BSC
        INNER JOIN consultation c ON c.ID_CONSULTATION = BSC.ID_CONSULTATION 
                                 AND c.EXERCICE = BSC.EXERCICE 
                                 AND c.ETAT IN (1, 3)
        LEFT JOIN bilan b ON b.ID_BILAN = BSC.ID_BILAN
        WHERE c.ID_MALADE IN (?)
        GROUP BY BSC.ID_CONSULTATION, BSC.EXERCICE, c.DATE_CONSULTATION
      ) combined
      WHERE TRIM(IFNULL(DESIGNATION, '')) != ''
      ORDER BY DATE_CONSULTATION DESC, ID_CONSULTATION DESC
    `;

    const [rows] = await pool.query(query, [ids, ids]).catch((err) => {
      console.warn("bilan query notice:", err.message);
      return [[]];
    });

    res.json(rows || []);
  } catch (err) {
    console.error("API /api/patients/:id/bilan-coche error:", err);
    res.json([]);
  }
});

// POST /api/patients/:id/bilan-coche - Save checked bilans (Selection mode) to bilan_consult_coche table
router.post("/:id/bilan-coche", async (req, res) => {
  try {
    const patId = req.params.id;
    const { selectedBilans } = req.body;

    if (!selectedBilans) {
      return res.status(400).json({ error: "No bilans selected" });
    }

    const [patRows] = await pool.query(
      "SELECT CODE_BARRE, CODE_MALADE FROM malade WHERE CODE_BARRE = ? OR CODE_MALADE = ?",
      [patId, patId]
    ).catch(() => [[]]);

    const ids = [];
    if (patRows.length > 0) {
      if (patRows[0].CODE_BARRE) ids.push(patRows[0].CODE_BARRE);
      if (patRows[0].CODE_MALADE) ids.push(patRows[0].CODE_MALADE);
    }
    if (ids.length === 0) ids.push(patId);
    const patientIdForInsert = ids[0];

    const obsDate = new Date().toISOString().split("T")[0];
    const year = String(new Date().getFullYear());

    let [cRows] = await pool.query(
      "SELECT ID_CONSULTATION, EXERCICE FROM consultation WHERE ID_MALADE IN (?) AND DATE(DATE_CONSULTATION) = CURRENT_DATE() AND ETAT != 2 ORDER BY ID_CONSULTATION DESC LIMIT 1",
      [ids]
    ).catch(() => [[]]);

    let idConsult, exYear;
    if (cRows.length > 0) {
      idConsult = cRows[0].ID_CONSULTATION;
      exYear = cRows[0].EXERCICE || year;
    } else {
      const [cMax] = await pool.query(
        "SELECT COALESCE(MAX(ID_CONSULTATION), 0) + 1 AS nextId FROM consultation WHERE EXERCICE = ?",
        [year]
      ).catch(() => [[{ nextId: 1 }]]);
      idConsult = cMax[0].nextId;
      exYear = year;

      await pool.query(
        "INSERT INTO consultation (ID_CONSULTATION, ID_MALADE, DATE_CONSULTATION, EXERCICE, TOTAL, ETAT, ID_USER, ID_VERSEMENT, ID_POSTE, FOCUS, INT_CONSULTATION, INT_LASER, INT_SCLERO) VALUES (?, ?, CURRENT_DATE(), ?, 0, 1, 1, 0, '', 0, 1, 0, 0)",
        [idConsult, String(patientIdForInsert), year]
      ).catch(err => console.error("Error creating consultation for bilan:", err));
    }

    const [cols] = await pool.query("SHOW COLUMNS FROM bilan_consult_coche").catch(() => [[]]);
    if (cols && cols.length > 0) {
      const [existB] = await pool.query(
        "SELECT * FROM bilan_consult_coche WHERE ID_CONSULTATION = ? AND EXERCICE = ?",
        [idConsult, String(exYear)]
      ).catch(() => [[]]);

      const bData = existB.length > 0 ? { ...existB[0] } : {};
      bData.ID_CONSULTATION = idConsult;
      bData.EXERCICE = String(exYear);
      bData.DATE_BILAN = obsDate;

      if (selectedBilans) {
        for (const k in selectedBilans) {
          if (k === 'AUTRE') {
            bData.AUTRE = selectedBilans.AUTRE || '';
          } else if (selectedBilans[k]) {
            bData[k] = 1;
          } else {
            bData[k] = 0;
          }
        }
      }

      if (existB.length > 0) {
        await pool.query("DELETE FROM bilan_consult_coche WHERE ID_CONSULTATION = ? AND EXERCICE = ?", [idConsult, String(exYear)]).catch(() => {});
      }

      const fields = [];
      const values = [];

      for (const c of cols) {
        const colName = c.Field;
        if (bData[colName] !== undefined) {
          fields.push(`\`${colName}\``);
          values.push(bData[colName]);
        } else if (c.Null === "NO" && c.Default === null) {
          fields.push(`\`${colName}\``);
          if (colName.toUpperCase().startsWith("ID_") || c.Type.includes("int") || c.Type.includes("decimal") || c.Type.includes("float")) {
            values.push(0);
          } else {
            values.push("");
          }
        }
      }

      const fieldSql = fields.join(", ");
      const placeholderSql = fields.map(() => "?").join(", ");
      await pool.query(`INSERT INTO bilan_consult_coche (${fieldSql}) VALUES (${placeholderSql})`, values);
    }

    res.status(200).json({ success: true, idConsultation: idConsult });
  } catch (err) {
    console.error("POST /api/patients/:id/bilan-coche error:", err);
    res.status(500).json({ error: "Failed to save bilan_consult_coche" });
  }
});

// POST /api/patients/:id/bilan-saisie - Save Saisie mode free-text items to bilans_consult & bilan tables
router.post("/:id/bilan-saisie", async (req, res) => {
  try {
    const patId = req.params.id;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Bilan text cannot be empty" });
    }

    const [patRows] = await pool.query(
      "SELECT CODE_BARRE, CODE_MALADE FROM malade WHERE CODE_BARRE = ? OR CODE_MALADE = ?",
      [patId, patId]
    ).catch(() => [[]]);

    const ids = [];
    if (patRows.length > 0) {
      if (patRows[0].CODE_BARRE) ids.push(patRows[0].CODE_BARRE);
      if (patRows[0].CODE_MALADE) ids.push(patRows[0].CODE_MALADE);
    }
    if (ids.length === 0) ids.push(patId);
    const patientIdForInsert = ids[0];

    const year = String(new Date().getFullYear());

    let [cRows] = await pool.query(
      "SELECT ID_CONSULTATION, EXERCICE FROM consultation WHERE ID_MALADE IN (?) AND DATE(DATE_CONSULTATION) = CURRENT_DATE() AND ETAT != 2 ORDER BY ID_CONSULTATION DESC LIMIT 1",
      [ids]
    ).catch(() => [[]]);

    let idConsult, exYear;
    if (cRows.length > 0) {
      idConsult = cRows[0].ID_CONSULTATION;
      exYear = cRows[0].EXERCICE || year;
    } else {
      const [cMax] = await pool.query(
        "SELECT COALESCE(MAX(ID_CONSULTATION), 0) + 1 AS nextId FROM consultation WHERE EXERCICE = ?",
        [year]
      ).catch(() => [[{ nextId: 1 }]]);
      idConsult = cMax[0].nextId;
      exYear = year;

      await pool.query(
        "INSERT INTO consultation (ID_CONSULTATION, ID_MALADE, DATE_CONSULTATION, EXERCICE, TOTAL, ETAT, ID_USER, ID_VERSEMENT, ID_POSTE, FOCUS, INT_CONSULTATION, INT_LASER, INT_SCLERO) VALUES (?, ?, CURRENT_DATE(), ?, 0, 1, 1, 0, '', 0, 1, 0, 0)",
        [idConsult, String(patientIdForInsert), year]
      ).catch(err => console.error("Error creating consultation for bilan saisie:", err));
    }

    // Split text by : , ; or newline
    const rawItems = text.trim().split(/[:,;\n]/).map(s => s.trim()).filter(Boolean);
    const savedBilanIds = [];

    for (const itemStr of rawItems) {
      // Find in bilan table
      const [bCheck] = await pool.query(
        "SELECT ID_BILAN FROM bilan WHERE LOWER(TRIM(DESIGNATION)) = LOWER(TRIM(?)) LIMIT 1",
        [itemStr]
      ).catch(() => [[]]);

      let idBilan;
      if (bCheck.length > 0) {
        idBilan = bCheck[0].ID_BILAN;
      } else {
        const [bMax] = await pool.query("SELECT COALESCE(MAX(ID_BILAN), 0) + 1 AS nextId FROM bilan").catch(() => [[{ nextId: 1 }]]);
        idBilan = bMax[0].nextId;
        await pool.query(
          "INSERT INTO bilan (ID_BILAN, DESIGNATION, ETAT) VALUES (?, ?, 1)",
          [idBilan, itemStr]
        ).catch(err => console.error("Error inserting new bilan item:", err));
      }

      // Insert into bilans_consult
      const [bcCheck] = await pool.query(
        "SELECT ID_BILAN FROM bilans_consult WHERE ID_CONSULTATION = ? AND ID_BILAN = ? AND EXERCICE = ?",
        [idConsult, idBilan, String(exYear)]
      ).catch(() => [[]]);

      if (bcCheck.length === 0) {
        await pool.query(
          "INSERT INTO bilans_consult (ID_CONSULTATION, ID_BILAN, EXERCICE, RESULTAT) VALUES (?, ?, ?, '')",
          [idConsult, idBilan, String(exYear)]
        ).catch(err => console.error("Error inserting into bilans_consult:", err));
      }

      savedBilanIds.push(idBilan);
    }

    res.json({ success: true, count: savedBilanIds.length, bilanIds: savedBilanIds });
  } catch (err) {
    console.error("POST /api/patients/:id/bilan-saisie error:", err);
    res.status(500).json({ error: "Failed to save free-text lab reports" });
  }
});

// POST /api/patients/:id/arret - Save or update sick leave record in arret_consult
router.post("/:id/arret", async (req, res) => {
  try {
    const patId = req.params.id;
    const { days, startDate, endDate, reason, type, idConsultation, exercice } = req.body;

    const [patRows] = await pool.query(
      "SELECT CODE_BARRE, CODE_MALADE FROM malade WHERE CODE_BARRE = ? OR CODE_MALADE = ?",
      [patId, patId]
    ).catch(() => [[]]);

    const ids = [];
    if (patRows.length > 0) {
      if (patRows[0].CODE_BARRE) ids.push(patRows[0].CODE_BARRE);
      if (patRows[0].CODE_MALADE) ids.push(patRows[0].CODE_MALADE);
    }
    if (ids.length === 0) ids.push(patId);
    const patientIdForInsert = ids[0];

    const year = String(new Date().getFullYear());

    let idConsult = idConsultation;
    let exYear = exercice;

    if (!idConsult) {
      let [cRows] = await pool.query(
        "SELECT ID_CONSULTATION, EXERCICE FROM consultation WHERE ID_MALADE IN (?) AND DATE(DATE_CONSULTATION) = CURRENT_DATE() AND ETAT != 2 ORDER BY ID_CONSULTATION DESC LIMIT 1",
        [ids]
      ).catch(() => [[]]);

      if (cRows.length > 0) {
        idConsult = cRows[0].ID_CONSULTATION;
        exYear = cRows[0].EXERCICE || year;
      } else {
        const [cMax] = await pool.query(
          "SELECT COALESCE(MAX(ID_CONSULTATION), 0) + 1 AS nextId FROM consultation WHERE EXERCICE = ?",
          [year]
        ).catch(() => [[{ nextId: 1 }]]);
        idConsult = cMax[0].nextId;
        exYear = year;

        await pool.query(
          "INSERT INTO consultation (ID_CONSULTATION, ID_MALADE, DATE_CONSULTATION, EXERCICE, TOTAL, ETAT, ID_USER, ID_VERSEMENT, ID_POSTE, FOCUS, INT_CONSULTATION, INT_LASER, INT_SCLERO) VALUES (?, ?, CURRENT_DATE(), ?, 0, 1, 1, 0, '', 0, 1, 0, 0)",
          [idConsult, String(patientIdForInsert), year]
        ).catch(err => console.error("Error creating consultation for arret:", err));
      }
    }

    const nbDays = parseInt(days, 10) || 1;
    const typeVal = type === 'prolongation' ? 2 : type === 'reprise' ? 3 : 1;

    await pool.query(
      "DELETE FROM arret_consult WHERE ID_CONSULTATION = ? AND EXERCICE = ?",
      [idConsult, String(exYear)]
    ).catch(() => {});

    await pool.query(
      "INSERT INTO arret_consult (ID_CONSULTATION, EXERCICE, DATE_ARRET, DATE_DEBUT, DATE_FIN, NB_JOUR, TYPE, OBS) VALUES (?, ?, CURRENT_DATE(), ?, ?, ?, ?, ?)",
      [idConsult, String(exYear), startDate || new Date(), endDate || startDate, nbDays, typeVal, reason || '']
    );

    res.json({ success: true, idConsultation: idConsult });
  } catch (err) {
    console.error("POST /api/patients/:id/arret error:", err);
    res.status(500).json({ error: "Failed to save sick leave" });
  }
});

// GET /api/patients/:id/arret-history - List previous sick leave records from arret_consult
router.get("/:id/arret-history", async (req, res) => {
  try {
    const patId = req.params.id;
    const [patRows] = await pool.query(
      "SELECT CODE_BARRE, CODE_MALADE FROM malade WHERE CODE_BARRE = ? OR CODE_MALADE = ?",
      [patId, patId]
    ).catch(() => [[]]);

    const ids = [];
    if (patRows.length > 0) {
      if (patRows[0].CODE_BARRE) ids.push(patRows[0].CODE_BARRE);
      if (patRows[0].CODE_MALADE) ids.push(patRows[0].CODE_MALADE);
    }
    if (ids.length === 0) ids.push(patId);

    const [rows] = await pool.query(`
      SELECT 
        AC.ID_CONSULTATION,
        AC.EXERCICE,
        DATE_FORMAT(AC.DATE_ARRET, '%Y-%m-%d') AS dateArret,
        DATE_FORMAT(AC.DATE_DEBUT, '%Y-%m-%d') AS dateDebut,
        DATE_FORMAT(AC.DATE_FIN, '%Y-%m-%d') AS dateFin,
        AC.NB_JOUR AS nbJour,
        AC.TYPE AS type,
        AC.OBS AS obs,
        (DATE(AC.DATE_ARRET) = CURRENT_DATE() OR DATE(C.DATE_CONSULTATION) = CURRENT_DATE()) AS isToday
      FROM arret_consult AC
      INNER JOIN consultation C ON C.ID_CONSULTATION = AC.ID_CONSULTATION AND C.EXERCICE = AC.EXERCICE
      WHERE C.ID_MALADE IN (?) AND C.ETAT != 2
      ORDER BY AC.DATE_DEBUT DESC, AC.ID_CONSULTATION DESC
    `, [ids]);

    res.json(rows);
  } catch (err) {
    console.error("GET /api/patients/:id/arret-history error:", err);
    res.status(500).json({ error: "Failed to fetch sick leave history" });
  }
});

// DELETE /api/patients/:id/arret/:idConsultation/:exercice - Delete a sick leave record from arret_consult
router.delete("/:id/arret/:idConsultation/:exercice", async (req, res) => {
  try {
    const { idConsultation, exercice } = req.params;
    await pool.query(
      "DELETE FROM arret_consult WHERE ID_CONSULTATION = ? AND EXERCICE = ?",
      [idConsultation, String(exercice)]
    );
    res.json({ success: true, message: "Sick leave record deleted successfully" });
  } catch (err) {
    console.error("DELETE /api/patients/:id/arret error:", err);
    res.status(500).json({ error: "Failed to delete sick leave" });
  }
});

// POST /api/patients/:id/consultations - Add/Update observation note for today in obs_malade
router.post("/:id/consultations", async (req, res) => {
  try {
    const patId = req.params.id;
    const { chiefComplaint, diagnosis, clinicalNotes, date } = req.body;
    const obsDate = date || new Date().toISOString().split("T")[0];

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
    const patientIdForInsert = ids[0];

    // Only insert/update obs_malade if actual explicit observation text is provided by doctor (not raw JSON string)
    const { observation } = req.body;
    let cleanObs = null;
    if (observation && typeof observation === 'string' && !observation.trim().startsWith('{')) {
      cleanObs = observation.trim();
    } else if (req.body.observationText && typeof req.body.observationText === 'string' && !req.body.observationText.trim().startsWith('{')) {
      cleanObs = req.body.observationText.trim();
    }

    let newId = null;
    if (cleanObs) {
      const [existingObs] = await pool.query(
        "SELECT ID FROM obs_malade WHERE ID_MALADE IN (?) AND DATE_OBS = ?",
        [ids, obsDate]
      );

      if (existingObs.length === 0) {
        const [cols] = await pool.query("SHOW COLUMNS FROM obs_malade");
        const idCol = cols.find(c => c.Field === 'ID');
        const isAuto = idCol && idCol.Extra.includes('auto_increment');

        let sql, params;
        if (isAuto) {
          sql = "INSERT INTO obs_malade (ID_MALADE, DATE_OBS, OBS) VALUES (?, ?, ?)";
          params = [patientIdForInsert, obsDate, cleanObs];
        } else {
          sql = "INSERT INTO obs_malade (ID, ID_MALADE, DATE_OBS, OBS) VALUES ((SELECT COALESCE(MAX(t.ID), 0) + 1 FROM obs_malade t), ?, ?, ?)";
          params = [patientIdForInsert, obsDate, cleanObs];
        }

        const [result] = await pool.query(sql, params);
        newId = isAuto ? result.insertId : null;
      } else {
        newId = existingObs[0].ID;
        await pool.query("UPDATE obs_malade SET OBS = ? WHERE ID = ?", [cleanObs, newId]);
      }
    }

    // Update ETAT column to 1 in table consultation ONLY when user explicitly saves full consultation
    if (ids.length > 0 && (req.body.isFullSave === true || req.body.validateConsultation === true)) {
      await pool.query(
        "UPDATE consultation SET ETAT = 1 WHERE ID_MALADE IN (?) AND DATE(DATE_CONSULTATION) = CURRENT_DATE() AND ETAT != 2",
        [ids]
      );
    }

    // Save prescription lines directly into details_ordonnance_YYYY, medicament, and medicament_p tables
    const { prescriptions } = req.body;
    if (Array.isArray(prescriptions) && ids.length > 0) {
      try {
        let [cRows] = await pool.query(
          "SELECT ID_CONSULTATION, EXERCICE FROM consultation WHERE ID_MALADE IN (?) AND DATE(DATE_CONSULTATION) = CURRENT_DATE() AND ETAT != 2 ORDER BY ID_CONSULTATION DESC LIMIT 1",
          [ids]
        );

        if (cRows.length === 0) {
          const year = String(new Date().getFullYear());
          const [cMax] = await pool.query(
            "SELECT COALESCE(MAX(ID_CONSULTATION), 0) + 1 AS nextId FROM consultation WHERE EXERCICE = ?",
            [year]
          );
          const nextId = cMax[0].nextId;

          const [cols] = await pool.query("SHOW COLUMNS FROM consultation");
          const rowData = {
            ID_CONSULTATION: nextId,
            ID_MALADE: String(patientIdForInsert),
            DATE_CONSULTATION: new Date(),
            EXERCICE: year,
            ETAT: 1,
            TOTAL: 0
          };

          const fields = [];
          const values = [];

          for (const c of cols) {
            const colName = c.Field;
            if (c.Extra.includes("auto_increment")) continue;

            if (rowData[colName] !== undefined) {
              fields.push(`\`${colName}\``);
              values.push(rowData[colName]);
            } else if (c.Null === "NO" && c.Default === null) {
              fields.push(`\`${colName}\``);
              if (colName.toUpperCase().startsWith("ID_") || c.Type.includes("int") || c.Type.includes("decimal") || c.Type.includes("float")) {
                values.push(0);
              } else {
                values.push("");
              }
            }
          }

          const fieldSql = fields.join(", ");
          const placeholderSql = fields.map(() => "?").join(", ");
          await pool.query(`INSERT INTO consultation (${fieldSql}) VALUES (${placeholderSql})`, values);

          cRows = [{ ID_CONSULTATION: nextId, EXERCICE: year }];
        }

        if (cRows.length > 0) {
          const idConsultation = cRows[0].ID_CONSULTATION;
          const exercice = cRows[0].EXERCICE || new Date().getFullYear();
          const tableName = `details_ordonnance_${exercice}`;

          if (prescriptions.length > 0) {
            let assureInfoObj = req.body.assureInfo || null;
            if (!assureInfoObj && req.body.clinicalNotes) {
              try {
                const parsedNotes = typeof req.body.clinicalNotes === 'string' ? JSON.parse(req.body.clinicalNotes) : req.body.clinicalNotes;
                if (parsedNotes && parsedNotes.assureInfo) {
                  assureInfoObj = parsedNotes.assureInfo;
                }
              } catch (e) {}
            }

            // Ensure header row exists in ordonnance_consult_YYYY
            await ensureOrdonnanceConsultHeader(idConsultation, patientIdForInsert, exercice, assureInfoObj);

            // Ensure partition details table exists
            await ensureDetailsOrdonnanceTable(tableName);

            const [tCheck] = await pool.query("SHOW TABLES LIKE ?", [tableName]);
            if (tCheck.length > 0) {
              // Clear prior prescriptions using BOTH ID_CONSULTATION AND EXERCICE
              await pool.query(`DELETE FROM \`${tableName}\` WHERE ID_CONSULTATION = ? AND EXERCICE = ?`, [idConsultation, String(exercice)]);

              // Query columns ONCE before loop for high performance
              const [dCols] = await pool.query(`SHOW COLUMNS FROM \`${tableName}\``);

              let rxIndex = 1;
              for (const rx of prescriptions) {
                if (!rx.name || !rx.name.trim()) continue;
                const isType2 = Number(rx.type) === 2;

                let medId = isType2 
                  ? await getOrCreateMedicamentPId(rx.name)
                  : await getOrCreateMedicationId(rx.name);

                const formeId = await getOrCreateFormeId(rx.forme || '', medId);

                const dosageId = await getOrCreateDosageId(medId, rx.dosage, formeId);
                const freqId = await getOrCreateFrequenceId(medId, rx.frequency);

                const rowData = {
                  ID_CONSULTATION: idConsultation,
                  ID_MEDICAMENT: medId,
                  TYPE: isType2 ? 2 : 1,
                  DOSAGE: rx.dosage || "",
                  FREQUENCE: rx.frequency || "",
                  QTE: rx.duration || "",
                  EXERCICE: String(exercice),
                  ID_ORDONNANCE: rxIndex
                };

                if (formeId) rowData.ID_FORME = formeId;
                if (dosageId) rowData.ID_DOSAGE = dosageId;
                if (freqId) rowData.ID_FREQUENCE = freqId;

                const dFields = [];
                const dValues = [];

                for (const c of dCols) {
                  const colName = c.Field;
                  if (c.Extra.includes("auto_increment")) continue;

                  if (rowData[colName] !== undefined) {
                    dFields.push(`\`${colName}\``);
                    dValues.push(rowData[colName]);
                  } else if (c.Null === "NO" && c.Default === null) {
                    dFields.push(`\`${colName}\``);
                    if (colName.toUpperCase().includes("ORDONNANCE")) {
                      dValues.push(rxIndex);
                    } else if (colName.toUpperCase().startsWith("ID_") || c.Type.includes("int") || c.Type.includes("decimal") || c.Type.includes("float")) {
                      dValues.push(0);
                    } else {
                      dValues.push("");
                    }
                  }
                }

                const dFieldSql = dFields.join(", ");
                const dPlaceholderSql = dFields.map(() => "?").join(", ");
                const updateAssignments = dFields.map(f => `${f} = VALUES(${f})`).join(", ");
                await pool.query(
                  `INSERT INTO \`${tableName}\` (${dFieldSql}) VALUES (${dPlaceholderSql}) ON DUPLICATE KEY UPDATE ${updateAssignments}`,
                  dValues
                );

                rxIndex++;
              }
            }
          } else {
            // Prescription table is empty (all rows deleted): remove header row and details using BOTH ID_CONSULTATION AND EXERCICE
            await removeOrdonnanceConsultHeader(idConsultation, exercice);

            const [tCheck] = await pool.query("SHOW TABLES LIKE ?", [tableName]);
            if (tCheck.length > 0) {
              await pool.query(`DELETE FROM \`${tableName}\` WHERE ID_CONSULTATION = ? AND EXERCICE = ?`, [idConsultation, String(exercice)]);
            }
          }
        }
      } catch (errRx) {
        console.error(`Error saving prescriptions to details_ordonnance:`, errRx);
      }
    }

    // Save checked bilans into bilan_consult_coche table in MySQL
    let selBilans = req.body.selectedBilans || null;
    if (!selBilans && req.body.clinicalNotes) {
      try {
        const parsedNotes = typeof req.body.clinicalNotes === 'string' ? JSON.parse(req.body.clinicalNotes) : req.body.clinicalNotes;
        if (parsedNotes && parsedNotes.selectedBilans) {
          selBilans = parsedNotes.selectedBilans;
        }
      } catch (e) {}
    }

    if (selBilans && ids.length > 0) {
      try {
        let [cRows] = await pool.query(
          "SELECT ID_CONSULTATION, EXERCICE FROM consultation WHERE ID_MALADE IN (?) AND DATE(DATE_CONSULTATION) = CURRENT_DATE() AND ETAT != 2 ORDER BY ID_CONSULTATION DESC LIMIT 1",
          [ids]
        );
        if (cRows.length > 0) {
          const idConsult = cRows[0].ID_CONSULTATION;
          const exYear = cRows[0].EXERCICE || new Date().getFullYear();

          const [cols] = await pool.query("SHOW COLUMNS FROM bilan_consult_coche");
          if (cols && cols.length > 0) {
            const bData = {
              ID_CONSULTATION: idConsult,
              EXERCICE: String(exYear),
              DATE_BILAN: obsDate,
              FNS: selBilans.FNS ? 1 : 0,
              GROUPAGE: selBilans.GROUPAGE ? 1 : 0,
              TP: selBilans.TP ? 1 : 0,
              FIBROGENE: selBilans.FIBROGENE ? 1 : 0,
              VS: selBilans.VS ? 1 : 0,
              FER: selBilans.FER ? 1 : 0,
              FERRITINE: selBilans.FERRITINE ? 1 : 0,
              GLYCEMIE: selBilans.GLYCEMIE ? 1 : 0,
              HBA1C: selBilans.HBA1C ? 1 : 0,
              SGOT: selBilans.SGOT ? 1 : 0,
              GAMMA: selBilans.GAMMA ? 1 : 0,
              BILIRUBINEMIE: selBilans.BILIRUBINEMIE ? 1 : 0,
              TOTALE: selBilans.TOTALE ? 1 : 0,
              CONJUGE: selBilans.CONJUGE ? 1 : 0,
              NONCONJUGE: selBilans.NONCONJUGE ? 1 : 0,
              UREE: selBilans.UREE ? 1 : 0,
              ECBU: selBilans.ECBU ? 1 : 0,
              CHOLESTEROL: selBilans.CHOLESTEROL ? 1 : 0,
              HDL: selBilans.HDL ? 1 : 0,
              LDL: selBilans.LDL ? 1 : 0,
              TRIGLYCERIDE: selBilans.TRIGLYCERIDE ? 1 : 0,
              KALIEMIE: selBilans.KALIEMIE ? 1 : 0,
              CALCEMIE: selBilans.CALCEMIE ? 1 : 0,
              RUBEOLE: selBilans.RUBEOLE ? 1 : 0,
              TOXOPLASMOSE: selBilans.TOXOPLASMOSE ? 1 : 0,
              SYPHIS: selBilans.SYPHIS ? 1 : 0,
              HIV: selBilans.HIV ? 1 : 0,
              URIQUE: selBilans.URIQUE ? 1 : 0,
              CRP: selBilans.CRP ? 1 : 0,
              ALBUMINEMIE: selBilans.ALBUMINEMIE ? 1 : 0,
              PROTEIN: selBilans.PROTEIN ? 1 : 0,
              PROTEIN24: selBilans.PROTEIN24 ? 1 : 0,
              FT3: selBilans.FT3 ? 1 : 0,
              FSH: selBilans.FSH ? 1 : 0,
              TSHUS: selBilans.TSHUS ? 1 : 0,
              LH: selBilans.LH ? 1 : 0,
              ASAT: selBilans.ASAT ? 1 : 0,
              PHOSPHATASES: selBilans.PHOSPHATASES ? 1 : 0,
              ASLO: selBilans.ASLO ? 1 : 0,
              PROLACTINE: selBilans.PROLACTINE ? 1 : 0,
              AMH: selBilans.AMH ? 1 : 0,
              PROGESTERONE: selBilans.PROGESTERONE ? 1 : 0,
              DHEA: selBilans.DHEA ? 1 : 0,
              DELTA: selBilans.DELTA ? 1 : 0,
              ETF: selBilans.ETF ? 1 : 0,
              EEG: selBilans.EEG ? 1 : 0,
              VIT_D: selBilans.VIT_D ? 1 : 0,
              ELETRO_HEMOG: selBilans.ELETRO_HEMOG ? 1 : 0,
              DOSAGE_DEPAKINE: selBilans.DOSAGE_DEPAKINE ? 1 : 0,
              RADIO_MAIN: selBilans.RADIO_MAIN ? 1 : 0,
              TELETHORAX: selBilans.TELETHORAX ? 1 : 0,
              COPRO_PARASIT: selBilans.COPRO_PARASIT ? 1 : 0,
              DOSAGE_HORM_CROISS: selBilans.DOSAGE_HORM_CROISS ? 1 : 0,
              SEROLOGIE_MALADIE_COELIAQUE: selBilans.SEROLOGIE_MALADIE_COELIAQUE ? 1 : 0,
              ACS: selBilans.ACS ? 1 : 0,
              ANTI_TRANSGLUT: selBilans.ANTI_TRANSGLUT ? 1 : 0,
              ANTIENDOM: selBilans.ANTIENDOM ? 1 : 0,
              ANTI_GLIADINE: selBilans.ANTI_GLIADINE ? 1 : 0,
              AUTRE: selBilans.AUTRE || ''
            };

            await pool.query("DELETE FROM bilan_consult_coche WHERE ID_CONSULTATION = ? AND EXERCICE = ?", [idConsult, String(exYear)]);

            const fields = [];
            const values = [];

            for (const c of cols) {
              const colName = c.Field;
              if (bData[colName] !== undefined) {
                fields.push(`\`${colName}\``);
                values.push(bData[colName]);
              } else if (c.Null === "NO" && c.Default === null) {
                fields.push(`\`${colName}\``);
                if (colName.toUpperCase().startsWith("ID_") || c.Type.includes("int") || c.Type.includes("decimal") || c.Type.includes("float")) {
                  values.push(0);
                } else {
                  values.push("");
                }
              }
            }

            const fieldSql = fields.join(", ");
            const placeholderSql = fields.map(() => "?").join(", ");
            await pool.query(`INSERT INTO bilan_consult_coche (${fieldSql}) VALUES (${placeholderSql})`, values);
          }
        }
      } catch (errBilan) {
        console.error("Error saving to bilan_consult_coche:", errBilan);
      }
    }

    res.status(201).json({
      id: `c-${newId || Date.now()}`,
      date: obsDate,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      doctor: "Médecin",
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

// --- NUTRITION / ALIMENTATION ENDPOINTS ---
// GET /api/patients/:id/nutrition - List nutrition history for a patient from alimentation_malade
router.get("/:id/nutrition", async (req, res) => {
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
      `SELECT am.ID_ALIMENTATION as id,
              am.ID_MALADE as patientId,
              DATE_FORMAT(am.DATE_PRISE, '%Y-%m-%d') as date,
              a.DESIGNATION as nutrition
       FROM alimentation_malade am
       JOIN alimentation a ON am.ID_ALIMENTATION = a.ID_ALIMENTATION
       WHERE am.ID_MALADE IN (?)
       ORDER BY am.DATE_PRISE DESC, am.ID_ALIMENTATION DESC`,
      [ids]
    );

    res.json(rows);
  } catch (err) {
    console.error("API GET /api/patients/:id/nutrition Error:", err);
    res.status(500).json({ error: "Failed to fetch patient nutrition records" });
  }
});

// POST /api/patients/:id/nutrition - Add/Update single nutrition record for today in alimentation & alimentation_malade
router.post("/:id/nutrition", async (req, res) => {
  try {
    const patId = req.params.id;
    const { nutrition, date } = req.body;
    if (!nutrition || !nutrition.trim()) {
      return res.status(400).json({ error: "Nutrition value is required" });
    }

    const recordDate = date || new Date().toISOString().split("T")[0];

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
    const patientIdForInsert = ids[0];

    const trimmedNutr = nutrition.trim();

    let idAlimentation = null;
    const [existingAlim] = await pool.query(
      "SELECT ID_ALIMENTATION FROM alimentation WHERE DESIGNATION = ?",
      [trimmedNutr]
    );

    if (existingAlim.length > 0) {
      idAlimentation = existingAlim[0].ID_ALIMENTATION;
    } else {
      const [maxAlim] = await pool.query("SELECT COALESCE(MAX(ID_ALIMENTATION), 0) + 1 as nextId FROM alimentation");
      idAlimentation = maxAlim[0].nextId;
      await pool.query(
        "INSERT INTO alimentation (ID_ALIMENTATION, DESIGNATION) VALUES (?, ?)",
        [idAlimentation, trimmedNutr]
      );
    }

    await pool.query(
      "DELETE FROM alimentation_malade WHERE ID_MALADE IN (?) AND DATE_PRISE = ?",
      [ids, recordDate]
    );

    await pool.query(
      "INSERT INTO alimentation_malade (ID_ALIMENTATION, ID_MALADE, DATE_PRISE) VALUES (?, ?, ?)",
      [idAlimentation, patientIdForInsert, recordDate]
    );

    res.status(201).json({
      success: true,
      id: idAlimentation,
      patientId: patientIdForInsert,
      date: recordDate,
      nutrition: trimmedNutr
    });
  } catch (err) {
    console.error("API POST /api/patients/:id/nutrition Error:", err);
    res.status(500).json({ error: "Failed to add nutrition record" });
  }
});

// DELETE /api/patients/nutrition/:id - Delete a nutrition record from alimentation_malade
router.delete("/nutrition/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await pool.query("DELETE FROM alimentation_malade WHERE ID_ALIMENTATION = ?", [id]);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    console.error("API DELETE /api/patients/nutrition/:id Error:", err);
    res.status(500).json({ error: "Failed to delete nutrition record" });
  }
});

// --- CONSULT. DIAGNOSIS ENDPOINTS ---
// GET /api/patients/:id/diag-consult - List consult diagnosis history for a patient from diag_malade
router.get("/:id/diag-consult", async (req, res) => {
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
      `SELECT dm.ID_DIAG as id,
              dm.ID_MALADE as patientId,
              DATE_FORMAT(dm.DATE_PRISE, '%Y-%m-%d') as date,
              d.DESIGNATION as diagnosis
       FROM diag_malade dm
       JOIN diagnostique d ON dm.ID_DIAG = d.ID_DIAG
       WHERE dm.ID_MALADE IN (?)
       ORDER BY dm.DATE_PRISE DESC, dm.ID_DIAG DESC`,
      [ids]
    );

    res.json(rows);
  } catch (err) {
    console.error("API GET /api/patients/:id/diag-consult Error:", err);
    res.status(500).json({ error: "Failed to fetch patient consult diagnosis records" });
  }
});

// POST /api/patients/:id/diag-consult - Add/Update single consult diagnosis record for today in diagnostique & diag_malade
router.post("/:id/diag-consult", async (req, res) => {
  try {
    const patId = req.params.id;
    const { diagnosis, date } = req.body;
    if (!diagnosis || !diagnosis.trim()) {
      return res.status(400).json({ error: "Diagnosis value is required" });
    }

    const recordDate = date || new Date().toISOString().split("T")[0];

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
    const patientIdForInsert = ids[0];

    const trimmedDiag = diagnosis.trim();

    let idDiag = null;
    const [existingDiag] = await pool.query(
      "SELECT ID_DIAG FROM diagnostique WHERE DESIGNATION = ?",
      [trimmedDiag]
    );

    if (existingDiag.length > 0) {
      idDiag = existingDiag[0].ID_DIAG;
    } else {
      const [maxDiag] = await pool.query("SELECT COALESCE(MAX(ID_DIAG), 0) + 1 as nextId FROM diagnostique");
      idDiag = maxDiag[0].nextId;
      await pool.query(
        "INSERT INTO diagnostique (ID_DIAG, DESIGNATION) VALUES (?, ?)",
        [idDiag, trimmedDiag]
      );
    }

    await pool.query(
      "DELETE FROM diag_malade WHERE ID_MALADE IN (?) AND DATE_PRISE = ?",
      [ids, recordDate]
    );

    await pool.query(
      "INSERT INTO diag_malade (ID_DIAG, ID_MALADE, DATE_PRISE) VALUES (?, ?, ?)",
      [idDiag, patientIdForInsert, recordDate]
    );

    res.status(201).json({
      success: true,
      id: idDiag,
      patientId: patientIdForInsert,
      date: recordDate,
      diagnosis: trimmedDiag
    });
  } catch (err) {
    console.error("API POST /api/patients/:id/diag-consult Error:", err);
    res.status(500).json({ error: "Failed to add consult diagnosis record" });
  }
});

// DELETE /api/patients/diag-consult/:id - Delete a consult diagnosis record from diag_malade
router.delete("/diag-consult/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await pool.query("DELETE FROM diag_malade WHERE ID_DIAG = ?", [id]);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    console.error("API DELETE /api/patients/diag-consult/:id Error:", err);
    res.status(500).json({ error: "Failed to delete consult diagnosis record" });
  }
});

// --- DDR & DPA (OBSTETRICS) ENDPOINTS ---
// GET /api/patients/:id/ddr-dpa - List DDR & DPA history for a patient from ddr_malade
router.get("/:id/ddr-dpa", async (req, res) => {
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
      `SELECT ID_DDR as id,
              ID_MALADE as patientId,
              DATE_PRISE as datePrise,
              DDR as ddrVal,
              DPA as dpaVal
       FROM ddr_malade
       WHERE ID_MALADE IN (?)
       ORDER BY DATE_PRISE DESC, ID_DDR DESC`,
      [ids]
    );

    const formatDashDate = (val) => {
      if (!val) return '';
      const str = String(val).trim();
      if (str.length === 8) {
        return `${str.slice(0,4)}-${str.slice(4,6)}-${str.slice(6,8)}`;
      }
      if (str.includes('T')) return str.split('T')[0];
      return str;
    };

    const formatted = rows.map(r => ({
      id: r.id,
      patientId: r.patientId,
      date: formatDashDate(r.datePrise),
      ddr: formatDashDate(r.ddrVal),
      dpa: formatDashDate(r.dpaVal)
    }));

    res.json(formatted);
  } catch (err) {
    console.error("API GET /api/patients/:id/ddr-dpa Error:", err);
    res.status(500).json({ error: "Failed to fetch patient DDR & DPA records" });
  }
});

// POST /api/patients/:id/ddr-dpa - Add/Update DDR & DPA record for today in ddr_malade
router.post("/:id/ddr-dpa", async (req, res) => {
  try {
    const patId = req.params.id;
    const { ddr, dpa, date } = req.body;

    const recordDateStr = date || new Date().toISOString().split("T")[0];

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
    const patientIdForInsert = ids[0];

    const toYYYYMMDD = (dStr) => dStr ? parseInt(dStr.replace(/-/g, ''), 10) : 0;

    const datePriseInt = toYYYYMMDD(recordDateStr);
    const ddrInt = toYYYYMMDD(ddr);
    const dpaInt = toYYYYMMDD(dpa);

    await pool.query(
      "DELETE FROM ddr_malade WHERE ID_MALADE IN (?) AND DATE_PRISE = ?",
      [ids, datePriseInt]
    );

    const [maxRows] = await pool.query("SELECT COALESCE(MAX(ID_DDR), 0) + 1 as nextId FROM ddr_malade");
    const nextId = maxRows[0].nextId;

    await pool.query(
      "INSERT INTO ddr_malade (ID_DDR, ID_MALADE, DATE_PRISE, DDR, DPA) VALUES (?, ?, ?, ?, ?)",
      [nextId, patientIdForInsert, datePriseInt, ddrInt, dpaInt]
    );

    res.status(201).json({
      success: true,
      id: nextId,
      patientId: patientIdForInsert,
      date: recordDateStr,
      ddr: ddr || '',
      dpa: dpa || ''
    });
  } catch (err) {
    console.error("API POST /api/patients/:id/ddr-dpa Error:", err);
    res.status(500).json({ error: "Failed to add DDR & DPA record" });
  }
});

// DELETE /api/patients/ddr-dpa/:id - Delete a DDR & DPA record
router.delete("/ddr-dpa/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await pool.query("DELETE FROM ddr_malade WHERE ID_DDR = ?", [id]);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    console.error("API DELETE /api/patients/ddr-dpa/:id Error:", err);
    res.status(500).json({ error: "Failed to delete DDR & DPA record" });
  }
});

// GET /api/patients/:id/general-diagnosis - Get general diagnosis from malade.DIAGNOSTIQUE
router.get("/:id/general-diagnosis", async (req, res) => {
  try {
    const patId = req.params.id;
    const [rows] = await pool.query(
      "SELECT DIAGNOSTIQUE FROM malade WHERE CODE_BARRE = ? OR CODE_MALADE = ?",
      [patId, patId]
    );
    res.json({
      generalDiagnosis: rows.length > 0 && rows[0].DIAGNOSTIQUE ? rows[0].DIAGNOSTIQUE : ""
    });
  } catch (err) {
    console.error("API GET /api/patients/:id/general-diagnosis Error:", err);
    res.status(500).json({ error: "Failed to fetch general diagnosis" });
  }
});

// POST /api/patients/:id/general-diagnosis - Update malade.DIAGNOSTIQUE
router.post("/:id/general-diagnosis", async (req, res) => {
  try {
    const patId = req.params.id;
    const { generalDiagnosis } = req.body;
    const diagText = generalDiagnosis !== undefined ? String(generalDiagnosis).trim() : "";

    await pool.query(
      "UPDATE malade SET DIAGNOSTIQUE = ? WHERE CODE_BARRE = ? OR CODE_MALADE = ?",
      [diagText, patId, patId]
    );

    res.json({
      success: true,
      generalDiagnosis: diagText
    });
  } catch (err) {
    console.error("API POST /api/patients/:id/general-diagnosis Error:", err);
    res.status(500).json({ error: "Failed to update general diagnosis" });
  }
});

export default router;
