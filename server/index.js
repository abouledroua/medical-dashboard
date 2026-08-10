import express from "express";
import cors from "cors";

import authRouter from "./routes/auth.js";
import statsRouter from "./routes/stats.js";
import settingsRouter from "./routes/settings.js";
import patientsRouter from "./routes/patients.js";
import appointmentsRouter from "./routes/appointments.js";
import consultationsRouter from "./routes/consultations.js";
import posteRouter from "./routes/poste.js";
import medicationsRouter from "./routes/medications.js";
import medicamentsRouter from "./routes/medicaments.js"; // Import the new router

import { myDB } from "./db.js";

const app = express();
const PORT = process.env.PORT || 3001;
app.set('trust proxy', true);

app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(
    `MediPulse Backend connected to MySQL (${myDB}) running on http://localhost:${PORT}`
  );
});
