import mysql from "mysql2/promise";
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root",
  database: "medical_dashboard",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function addActivationColumns() {
  try {
    const connection = await pool.getConnection();

    const columns = [
      { name: "GEST_RDV", desc: "Activation Gestion des Rendez-vous" },
      {
        name: "RESUME_DERN_CONS",
        desc: "Activation Résumer de la dernière consultation",
      },
      { name: "GEST_IMAGE", desc: "Activation Gestion des Images Médical" },
      { name: "APERCU", desc: "Activation Aperçu avant impression" },
    ];

    for (const col of columns) {
      try {
        await connection.execute(`
          ALTER TABLE parametre 
          ADD COLUMN ${col.name} INT DEFAULT 1 COMMENT '${col.desc}'
        `);
        console.log(`✅ Column ${col.name} added successfully`);
      } catch (err) {
        if (err.code === "ER_DUP_FIELDNAME") {
          console.log(`⏭️ Column ${col.name} already exists, skipping...`);
        } else {
          throw err;
        }
      }
    }

    console.log("✅ Migration completed successfully!");
    connection.release();
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration error:", err.message);
    process.exit(1);
  }
}

addActivationColumns();
