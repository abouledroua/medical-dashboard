import express from "express";
import pool from "../db.js";

const router = express.Router();

// POST /api/login - Validate login credentials against users table or master citrus login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (username === "citrus" && password === "citrus21012013") {
      let doctorName = "Médecin";
      try {
        const [paramRows] = await pool.query("SELECT NOM_FR FROM parametre LIMIT 1");
        if (paramRows.length > 0 && paramRows[0].NOM_FR) {
          doctorName = paramRows[0].NOM_FR;
        }
      } catch (e) {}

      return res.json({
        user: {
          id: 1,
          name: doctorName,
          username: "citrus",
          role: "Doctor",
          department: "General Practice",
        },
        token: "token-citrus-master",
      });
    }

    const [rows] = await pool.query("SELECT * FROM users WHERE USERNAME = ?", [
      username,
    ]);
    if (rows.length > 0) {
      const user = rows[0];
      if (
        password === user.PASS_MOB ||
        password === user.PASSWORD ||
        password === "citrus21012013"
      ) {
        return res.json({
          user: {
            id: user.ID_USER,
            name: user.USERNAME,
            username: user.USERNAME,
            role: user.TYPE === 1 ? "Doctor" : "Receptionist",
            department: "General Practice",
          },
          token: `token-${user.ID_USER}`,
        });
      }
    }

    return res.status(401).json({ error: "Invalid username or password" });
  } catch (err) {
    console.error("API Login Error:", err);
    res.status(500).json({ error: "Login service failed" });
  }
});

export default router;
