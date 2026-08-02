import express from "express";
import patientCoreRouter from "./patients/patientCore.js";
import patientVitalsRouter from "./patients/patientVitals.js";
import patientAntecedentsRouter from "./patients/patientAntecedents.js";
import patientConsultationsRouter from "./patients/patientConsultations.js";

const router = express.Router();

router.use("/", patientCoreRouter);
router.use("/", patientVitalsRouter);
router.use("/", patientAntecedentsRouter);
router.use("/", patientConsultationsRouter);

export default router;
