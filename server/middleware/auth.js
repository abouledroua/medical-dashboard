import pool from "../db.js";

export async function requireExistingUser(req, res, next) {
  if (req.path === "/login") {
    return next();
  }

  try {
    const userId = Number(req.headers["x-user-id"]);
    if (!userId) {
      return res.status(401).json({ error: "Session expired" });
    }

    const [rows] = await pool.query(
      "SELECT ID_USER FROM users WHERE ID_USER = ? LIMIT 1",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Session expired" });
    }

    return next();
  } catch (err) {
    console.error("Auth guard error:", err);
    return res.status(500).json({ error: "Authentication check failed" });
  }
}
