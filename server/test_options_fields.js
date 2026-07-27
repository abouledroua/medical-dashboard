import pool from "./db.js";

async function testOptions() {
  try {
    console.log("\n=== Testing Parametre Fields ===\n");

    // 1. Check what's in the database
    console.log("1. Current database contents:");
    const [rows] = await pool.query("SELECT * FROM parametre LIMIT 1");
    if (rows.length > 0) {
      const p = rows[0];
      console.log("   GEST_ORDONNANCE:", p.GEST_ORDONNANCE);
      console.log("   GEST_BILAN:", p.GEST_BILAN);
      console.log("   FREQ_MEDIC:", p.FREQ_MEDIC);
      console.log("   INFO_SUP_ORD:", p.INFO_SUP_ORD);
    }

    // 2. Test setting values
    console.log("\n2. Setting test values...");
    await pool.query(
      `UPDATE parametre SET 
        GEST_ORDONNANCE = 1,
        GEST_BILAN = 2,
        FREQ_MEDIC = 1,
        INFO_SUP_ORD = 1
      WHERE ID_PARAMETRE = 1`,
    );
    console.log("   ✓ Test values set");

    // 3. Verify they were saved
    console.log("\n3. Verifying saved values:");
    const [rows2] = await pool.query(
      "SELECT GEST_ORDONNANCE, GEST_BILAN, FREQ_MEDIC, INFO_SUP_ORD FROM parametre LIMIT 1",
    );
    if (rows2.length > 0) {
      const p = rows2[0];
      console.log(
        "   GEST_ORDONNANCE:",
        p.GEST_ORDONNANCE,
        typeof p.GEST_ORDONNANCE,
      );
      console.log("   GEST_BILAN:", p.GEST_BILAN, typeof p.GEST_BILAN);
      console.log("   FREQ_MEDIC:", p.FREQ_MEDIC, typeof p.FREQ_MEDIC);
      console.log("   INFO_SUP_ORD:", p.INFO_SUP_ORD, typeof p.INFO_SUP_ORD);
    }

    console.log("\n=== Test Complete ===\n");
    process.exit(0);
  } catch (err) {
    console.error("Test error:", err);
    process.exit(1);
  }
}

testOptions();
