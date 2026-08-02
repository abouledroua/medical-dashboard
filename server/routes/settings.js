import express from "express";
import clinicSettingsRouter from "./settings/clinicSettings.js";
import userSettingsRouter from "./settings/userSettings.js";

const router = express.Router();

router.use("/", clinicSettingsRouter);
router.use("/", userSettingsRouter);

export default router;
