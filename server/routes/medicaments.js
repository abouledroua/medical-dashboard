import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/medicaments', async (req, res) => {
  try {
    let medications;
    if (process.env.NODE_ENV === 'development') {
      medications = await db.all('SELECT * FROM medicaments');
    } else {
      const [rows] = await db.query('SELECT * FROM medicaments');
      medications = rows;
    }
    res.json(medications);
  } catch (error) {
    console.error('Error fetching medications:', error);
    res.status(500).json({ message: 'Failed to fetch medications', error: error.message });
  }
});

export default router;