import express from "express";
import pool from "../db.js";

const router = express.Router();

// GET all bilans
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM bilan ORDER BY DESIGNATION ASC");
        res.json(rows);
    } catch (err) {
        console.error("API /api/bilan GET Error:", err);
        res.status(500).json({ error: "Failed to fetch bilans", details: err.message });
    }
});

// POST a new bilan
router.post("/", async (req, res) => {
    try {
        const { designation } = req.body;
        
        if (!designation || designation.trim() === '') {
            return res.status(400).json({ error: "Designation cannot be empty" });
        }

        const [maxRows] = await pool.query("SELECT COALESCE(MAX(ID_BILAN), 0) AS maxBilan FROM bilan");
        const nextId = (Number(maxRows[0]?.maxBilan) || 0) + 1;

        await pool.query(
            "INSERT INTO bilan (ID_BILAN, DESIGNATION, ETAT) VALUES (?, ?, 1)",
            [nextId, designation]
        );

        res.status(201).json({ success: true, id: nextId });
    } catch (err) {
        console.error("API /api/bilan POST Error:", err);
        res.status(500).json({ error: "Failed to create bilan", details: err.message });
    }
});

// PUT update bilan designation
router.put("/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const { designation } = req.body;

        if (!designation || designation.trim() === '') {
            return res.status(400).json({ error: "Designation cannot be empty" });
        }

        await pool.query(
            "UPDATE bilan SET DESIGNATION = ? WHERE ID_BILAN = ?",
            [designation, id]
        );

        res.json({ success: true, id });
    } catch (err) {
        console.error("API /api/bilan PUT Error:", err);
        res.status(500).json({ error: "Failed to update bilan", details: err.message });
    }
});

// PATCH toggle bilan state
router.patch("/:id/toggle", async (req, res) => {
    try {
        const id = req.params.id;

        const [existing] = await pool.query("SELECT ETAT FROM bilan WHERE ID_BILAN = ?", [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: "Bilan not found" });
        }

        const currentEtat = existing[0].ETAT;
        const newEtat = currentEtat === 1 ? 0 : 1;

        await pool.query(
            "UPDATE bilan SET ETAT = ? WHERE ID_BILAN = ?",
            [newEtat, id]
        );

        res.json({ success: true, id, newEtat });
    } catch (err) {
        console.error("API /api/bilan toggle Error:", err);
        res.status(500).json({ error: "Failed to toggle bilan", details: err.message });
    }
});

// DELETE a bilan (with constraint check)
router.delete("/:id", async (req, res) => {
    try {
        const id = req.params.id;

        // Check bilans_consult for constraints
        const [consults] = await pool.query("SELECT 1 FROM bilans_consult WHERE ID_BILAN = ? LIMIT 1", [id]);
        if (consults.length > 0) {
            return res.status(400).json({ 
                error: "Impossible de supprimer ce bilan car il est déjà associé à une ou plusieurs consultations.",
                code: 'CONSTRAINT_VIOLATION'
            });
        }

        // Delete from DB
        await pool.query("DELETE FROM bilan WHERE ID_BILAN = ?", [id]);

        res.json({ success: true });
    } catch (err) {
        console.error("API /api/bilan DELETE Error:", err);
        res.status(500).json({ error: "Failed to delete bilan", details: err.message });
    }
});

export default router;
