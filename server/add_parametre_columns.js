import pool from "./db.js";

async function addParametreColumns() {
  try {
    console.log("Adding new columns to parametre table...");

    // Add GEST_ORDONNANCE column
    try {
      await pool.query(
        "ALTER TABLE parametre ADD COLUMN GEST_ORDONNANCE INT NULL",
      );
      console.log("✓ Added GEST_ORDONNANCE column");
    } catch (err) {
      if (err.code === "ER_DUP_FIELDNAME") {
        console.log("ℹ GEST_ORDONNANCE column already exists");
      } else {
        throw err;
      }
    }

    // Add GEST_BILAN column
    try {
      await pool.query("ALTER TABLE parametre ADD COLUMN GEST_BILAN INT NULL");
      console.log("✓ Added GEST_BILAN column");
    } catch (err) {
      if (err.code === "ER_DUP_FIELDNAME") {
        console.log("ℹ GEST_BILAN column already exists");
      } else {
        throw err;
      }
    }

    // Add FREQ_MEDIC column
    try {
      await pool.query("ALTER TABLE parametre ADD COLUMN FREQ_MEDIC INT NULL");
      console.log("✓ Added FREQ_MEDIC column");
    } catch (err) {
      if (err.code === "ER_DUP_FIELDNAME") {
        console.log("ℹ FREQ_MEDIC column already exists");
      } else {
        throw err;
      }
    }

    // Add INFO_SUP_ORD column
    try {
      await pool.query(
        "ALTER TABLE parametre ADD COLUMN INFO_SUP_ORD INT NULL",
      );
      console.log("✓ Added INFO_SUP_ORD column");
    } catch (err) {
      if (err.code === "ER_DUP_FIELDNAME") {
        console.log("ℹ INFO_SUP_ORD column already exists");
      } else {
        throw err;
      }
    }

    console.log("✓ Migration completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

addParametreColumns();
