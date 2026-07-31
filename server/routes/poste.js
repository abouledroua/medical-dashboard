import express from "express";
import pool from "../db.js";

const router = express.Router();

// GET /api/poste/:deviceId - Check if device exists in poste table
router.get("/:deviceId", async (req, res) => {
  try {
    const { deviceId } = req.params;
    if (!deviceId) {
      return res.status(400).json({ error: "deviceId is required" });
    }
    const [rows] = await pool.query(
      "SELECT ID_POSTE, NOM_DEVICE FROM poste WHERE ID_POSTE = ? LIMIT 1",
      [deviceId]
    );
    if (rows.length > 0) {
      return res.json({ exists: true, nomDevice: rows[0].NOM_DEVICE });
    } else {
      return res.json({ exists: false, nomDevice: null });
    }
  } catch (err) {
    console.error("API GET /api/poste/:deviceId Error:", err);
    res.status(500).json({ error: "Failed to check device" });
  }
});

// POST /api/poste - Save device ID and device name into poste table
router.post("/", async (req, res) => {
  try {
    const { deviceId, nomDevice } = req.body;
    if (!deviceId) {
      return res.status(400).json({ error: "deviceId is required" });
    }
    const deviceNameStr = nomDevice != null ? String(nomDevice).trim() : "";
    await pool.query(
      "INSERT INTO poste (ID_POSTE, NOM_DEVICE, ETAT) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE NOM_DEVICE = VALUES(NOM_DEVICE)",
      [deviceId, deviceNameStr]
    );
    res.json({ success: true, deviceId, nomDevice: deviceNameStr });
  } catch (err) {
    console.error("API POST /api/poste Error:", err);
    res.status(500).json({ error: "Failed to save device" });
  }
});

export default router;
