import express from "express";
import pool from "../../db.js";
import { requireExistingUser } from "../../middleware/auth.js";

const router = express.Router();

// GET /api/users - Minimal user list for settings
router.get("/users", requireExistingUser, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ID_USER, USERNAME, PASS_MOB, TYPE
       FROM users
       ORDER BY ID_USER ASC`
    );

    res.json(
      rows.map((row) => ({
        id: row.ID_USER,
        username: row.USERNAME ?? "",
        password: row.PASS_MOB ?? "",
        type: Number(row.TYPE) === 1 ? 1 : 0,
      }))
    );
  } catch (err) {
    console.error("API /api/users Error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// POST /api/users - Create new user account
router.post("/users", requireExistingUser, async (req, res) => {
  try {
    const { username, password, type } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const nextType = Number(type) === 1 ? 1 : 0;
    const [result] = await pool.query(
      `INSERT INTO users (USERNAME, PASSWORD, PASS_MOB, TYPE, FONCTION)
       VALUES (?, ?, ?, ?, ?)`,
      [username, password, password, nextType, nextType]
    );

    res.status(201).json({
      success: true,
      user: {
        id: result.insertId,
        username,
        password,
        type: nextType,
      },
    });
  } catch (err) {
    console.error("API POST /api/users Error:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// PUT /api/users/:id - Update user account details
router.put("/users/:id", requireExistingUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, type } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const nextType = Number(type) === 1 ? 1 : 0;
    const [result] = await pool.query(
      `UPDATE users
       SET USERNAME = ?, PASSWORD = ?, PASS_MOB = ?, TYPE = ?, FONCTION = ?
       WHERE ID_USER = ?`,
      [username, password, password, nextType, nextType, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      user: {
        id: Number(id),
        username,
        password,
        type: nextType,
      },
    });
  } catch (err) {
    console.error("API PUT /api/users/:id Error:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// DELETE /api/users/:id - Delete user account
router.delete("/users/:id", requireExistingUser, async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM users WHERE ID_USER = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("API DELETE /api/users/:id Error:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
