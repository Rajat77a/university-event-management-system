const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// ================= DATABASE CONNECTION =================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// ================= TEST ROUTE =================

app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      message: "Database connected successfully 🚀",
      time: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      error: "Database connection failed ❌",
      details: error.message,
    });
  }
});

// ================= USERS API =================

// Create User
app.post("/api/users", async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO users (name, email, phone, password, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, email, phone, password, role || "student"]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All Users
app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM users ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 TEMP TEST USER ROUTE (Browser Friendly)
app.get("/create-test-user", async (req, res) => {
  try {
    const result = await pool.query(
      `INSERT INTO users (name, email, phone, password, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        "Test User",
        "test@example.com",
        "1234567890",
        "password123",
        "student",
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= EVENTS API =================

// Get All Events
app.get("/api/events", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT events.*, users.name as creator_name
      FROM events
      JOIN users ON events.created_by = users.id
      ORDER BY events.date ASC
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Event
app.post("/api/events", async (req, res) => {
  const { title, description, date, location, created_by } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO events (title, description, date, location, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, description, date, location, created_by]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= START SERVER =================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
