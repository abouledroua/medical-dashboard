import mysql from "mysql2/promise";

async function addConsultationColumns() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "root",
      database: "medical_dashboard",
    });

    const columns = [
      { name: "ORD", desc: "Ordonnance option in consultation" },
      { name: "CERT_MEDIC", desc: "Certificat Médical option in consultation" },
      { name: "BILAN", desc: "Bilans option in consultation" },
      { name: "LET_OR", desc: "Lettre d'Orientation option in consultation" },
      { name: "ARRET_TRAV", desc: "Arrêt de Travail option in consultation" },
      { name: "MOTIF", desc: "Document Médical option in consultation" },
    ];

    for (const col of columns) {
      try {
        await connection.execute(`
          ALTER TABLE param_consult 
          ADD COLUMN ${col.name} INT DEFAULT 1 COMMENT '${col.desc}'
        `);
        console.log(`✅ Column ${col.name} added successfully`);
      } catch (err) {
        if (err.code === "ER_DUP_FIELDNAME") {
          console.log(`⏭️ Column ${col.name} already exists, skipping...`);
        } else {
          console.error(`❌ Error adding ${col.name}:`, err.message);
        }
      }
    }

    console.log("✅ Migration completed successfully!");
    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration error:", err.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

addConsultationColumns();
