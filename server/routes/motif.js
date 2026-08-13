import express from "express";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import pool from "../db.js";
import multer from "multer";
import { exec } from "child_process";

const router = express.Router();
const MODELE_DIR = path.join(process.cwd(), "server", "Modele_Document");
const upload = multer({ storage: multer.memoryStorage() });

// Ensure the directory exists
const ensureDir = async () => {
    try {
        await fs.access(MODELE_DIR);
    } catch {
        await fs.mkdir(MODELE_DIR, { recursive: true });
    }
};

// Helper to sanitize filenames
const sanitize = (name) => name.replace(/[^a-z0-9_\-\s]/gi, '_').trim();

const getExistingFilePath = async (safeDesignation) => {
    const exts = ['.docx', '.doc', '.rtf'];
    for (const ext of exts) {
        const filePath = path.join(MODELE_DIR, `${safeDesignation}${ext}`);
        try {
            await fs.access(filePath);
            return { filePath, ext };
        } catch { }
    }
    return { filePath: null, ext: null };
};

const getFileSha = async (filePath) => {
    try {
        const fileBuffer = await fs.readFile(filePath);
        const hashSum = crypto.createHash('sha256');
        hashSum.update(fileBuffer);
        return hashSum.digest('hex');
    } catch (err) {
        console.error("Hash error:", err);
        return '';
    }
};

const deleteDrafts = async (safeDesignation) => {
    const exts = ['.docx', '.doc', '.rtf'];
    for (const ext of exts) {
        try { await fs.unlink(path.join(MODELE_DIR, `${safeDesignation}${ext}`)); } catch { }
    }
};

const renameDrafts = async (oldSafeDesignation, newSafeDesignation) => {
    const exts = ['.docx', '.doc', '.rtf'];
    for (const ext of exts) {
        try {
            await fs.rename(
                path.join(MODELE_DIR, `${oldSafeDesignation}${ext}`),
                path.join(MODELE_DIR, `${newSafeDesignation}${ext}`)
            );
        } catch { }
    }
};

// Get all motifs
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM motif ORDER BY DESIGNATION ASC");
        res.json(rows);
    } catch (err) {
        console.error("API /api/motif GET Error:", err);
        res.status(500).json({ error: "Failed to fetch motifs", details: err.message });
    }
});

// Upload Draft
router.post("/upload-draft", upload.single("file"), async (req, res) => {
    try {
        const { designation } = req.body;
        if (!designation) {
            return res.status(400).json({ error: "Designation is required" });
        }
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        await ensureDir();
        const safeDesignation = sanitize(designation);

        await deleteDrafts(safeDesignation);

        const fileExt = req.file.originalname ? (path.extname(req.file.originalname).toLowerCase() || '.docx') : '.docx';
        const filePath = path.join(MODELE_DIR, `${safeDesignation}${fileExt}`);

        await fs.writeFile(filePath, req.file.buffer);

        res.json({ success: true, message: "File uploaded as draft" });
    } catch (err) {
        console.error("API /api/motif/upload-draft Error:", err);
        res.status(500).json({ error: "Failed to upload file", details: err.message });
    }
});

// Download existing
router.get("/download/:designation", async (req, res) => {
    try {
        const designation = req.params.designation;
        if (!designation) {
            return res.status(400).json({ error: "Designation is required" });
        }

        const safeDesignation = sanitize(designation);
        const { filePath, ext } = await getExistingFilePath(safeDesignation);

        if (!filePath) {
            return res.status(404).json({ error: "File not found on server" });
        }

        res.download(filePath, `${safeDesignation}${ext}`);
    } catch (err) {
        console.error("API /api/motif/download Error:", err);
        res.status(500).json({ error: "Failed to download file", details: err.message });
    }
});

// Delete draft document
router.post("/delete-draft", express.json(), async (req, res) => {
    try {
        const { designation } = req.body;
        if (!designation) {
            return res.status(400).json({ error: "Designation is required" });
        }

        const safeDesignation = sanitize(designation);
        await deleteDrafts(safeDesignation);

        res.json({ success: true, message: "Draft deleted" });
    } catch (err) {
        console.error("API /api/motif/delete-draft Error:", err);
        res.status(500).json({ error: "Failed to delete draft", details: err.message });
    }
});

// Create new motif
router.post("/", async (req, res) => {
    try {
        const { designation, prix, hasAttachedDocument } = req.body;

        if (!designation || designation.trim() === '') {
            return res.status(400).json({ error: "Designation cannot be empty" });
        }

        const intWord = hasAttachedDocument ? 1 : 0;
        const finalPrix = parseFloat(prix) || 0;

        // Get next ID
        const [maxRows] = await pool.query("SELECT COALESCE(MAX(ID_MOTIF), 0) AS maxMotif FROM motif");
        const nextId = (Number(maxRows[0]?.maxMotif) || 0) + 1;

        const safeDesignation = sanitize(designation);
        let chemin = '';
        let sha = '';
        if (intWord === 1) {
            const { filePath, ext } = await getExistingFilePath(safeDesignation);
            if (ext) {
                chemin = `${safeDesignation}${ext}`;
                sha = await getFileSha(filePath);
            }
        }

        // Save to DB
        await pool.query(
            "INSERT INTO motif (ID_MOTIF, DESIGNATION, CHEMIN, PRIX, ETAT, INT_WORD, SHA) VALUES (?, ?, ?, ?, 1, ?, ?)",
            [nextId, designation, chemin, finalPrix, intWord, sha]
        );

        res.status(201).json({ success: true, id: nextId });
    } catch (err) {
        console.error("API /api/motif POST Error:", err);
        res.status(500).json({ error: "Failed to create motif", details: err.message });
    }
});

// Update motif
router.put("/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const { designation, prix, hasAttachedDocument } = req.body;

        if (!designation || designation.trim() === '') {
            return res.status(400).json({ error: "Designation cannot be empty" });
        }

        const intWord = hasAttachedDocument ? 1 : 0;
        const finalPrix = parseFloat(prix) || 0;

        // Get existing to find old designation
        const [existingRows] = await pool.query("SELECT DESIGNATION FROM motif WHERE ID_MOTIF = ?", [id]);
        if (existingRows.length === 0) {
            return res.status(404).json({ error: "Motif not found" });
        }

        const oldDesignation = existingRows[0].DESIGNATION;
        const safeDesignation = sanitize(designation);
        const safeOldDesignation = sanitize(oldDesignation);

        let chemin = '';
        let sha = '';
        if (intWord === 1) {
            let { filePath, ext } = await getExistingFilePath(safeDesignation);
            if (!ext) {
                const oldRes = await getExistingFilePath(safeOldDesignation);
                ext = oldRes.ext;
                filePath = oldRes.filePath;
            }
            if (ext) {
                chemin = `${safeDesignation}${ext}`;
                sha = await getFileSha(filePath);
            }
        }

        // Update DB
        await pool.query(
            "UPDATE motif SET DESIGNATION = ?, CHEMIN = ?, PRIX = ?, INT_WORD = ?, SHA = ? WHERE ID_MOTIF = ?",
            [designation, chemin, finalPrix, intWord, sha, id]
        );

        await ensureDir();

        if (intWord === 1) {
            // If name changed, rename file
            if (sanitize(oldDesignation) !== sanitize(designation)) {
                await renameDrafts(sanitize(oldDesignation), sanitize(designation));
            }
        } else {
            // Checkbox unchecked, delete file if it exists
            await deleteDrafts(sanitize(oldDesignation));
            await deleteDrafts(sanitize(designation));
        }

        res.json({ success: true, id });
    } catch (err) {
        console.error("API /api/motif PUT Error:", err);
        res.status(500).json({ error: "Failed to update motif", details: err.message });
    }
});

// Toggle motif state
router.patch("/:id/toggle", async (req, res) => {
    try {
        const id = req.params.id;

        const [existing] = await pool.query("SELECT ETAT FROM motif WHERE ID_MOTIF = ?", [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: "Motif not found" });
        }

        const currentEtat = existing[0].ETAT;
        const newEtat = currentEtat === 1 ? 0 : 1;

        await pool.query(
            "UPDATE motif SET ETAT = ? WHERE ID_MOTIF = ?",
            [newEtat, id]
        );

        res.json({ success: true, id, newEtat });
    } catch (err) {
        console.error("API /api/motif toggle Error:", err);
        res.status(500).json({ error: "Failed to toggle motif", details: err.message });
    }
});

// Delete motif
router.delete("/:id", async (req, res) => {
    try {
        const id = req.params.id;

        // Get existing to find designation
        const [existingRows] = await pool.query("SELECT DESIGNATION FROM motif WHERE ID_MOTIF = ?", [id]);

        if (existingRows.length > 0) {
            const oldDesignation = existingRows[0].DESIGNATION;
            await deleteDrafts(sanitize(oldDesignation));
        }

        // Delete from DB
        await pool.query("DELETE FROM motif WHERE ID_MOTIF = ?", [id]);

        res.json({ success: true });
    } catch (err) {
        console.error("API /api/motif DELETE Error:", err);
        res.status(500).json({ error: "Failed to delete motif", details: err.message });
    }
});

export default router;