import express from "express";
import cors from "cors";
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRouter from "./routes/auth.js";
import statsRouter from "./routes/stats.js";
import settingsRouter from "./routes/settings.js";
import patientsRouter from "./routes/patients.js";
import appointmentsRouter from "./routes/appointments.js";
import consultationsRouter from "./routes/consultations.js";
import posteRouter from "./routes/poste.js";
import medicationsRouter from "./routes/medications.js";
import medicamentsRouter from "./routes/medicaments.js"; // Import the new router
import motifRouter from "./routes/motif.js";
import bilanRouter from "./routes/bilan.js";

import { myDB } from "./db.js";

const app = express();
const PORT = process.env.PORT || 3001;
app.set('trust proxy', true);

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Mount Modular API Routers
app.use("/api", authRouter);
app.use("/api/stats", statsRouter);
app.use("/api", settingsRouter);
app.use("/api/patients", patientsRouter);
app.use("/api/appointments", appointmentsRouter);
app.use("/api/consultations", consultationsRouter);
app.use("/api/poste", posteRouter);
app.use("/api/medications", medicationsRouter);
app.use("/api", medicamentsRouter); // Use the new router
app.use("/api/motif", motifRouter);
app.use("/api/bilan", bilanRouter);

app.get("/api/select-folder", (req, res) => {
  const psPath = path.join(__dirname, "select_folder.ps1");
  exec(`powershell -ExecutionPolicy Bypass -File "${psPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error opening folder dialog: ${error.message}`);
      return res.status(500).json({ error: "Failed to open folder picker" });
    }
    res.json({ path: stdout.trim() });
  });
});

app.listen(PORT, () => {
  console.log(
    `MediPulse Backend connected to MySQL (${myDB}) running on http://localhost:${PORT}`
  );
});
