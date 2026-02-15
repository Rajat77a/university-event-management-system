const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// ================= DATABASE =================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ================= TEST =================
app.get("/", async (req, res) => {
  res.json({ message: "Backend Running 🚀" });
});

// ================= REGISTER =================
app.post("/api/register", async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO users (name, email, phone, password, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role`,
      [name, email, phone, password, role || "student"]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= LOGIN =================
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1 AND password=$2",
      [email, password]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= EVENTS =================
app.get("/api/events", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT events.*, users.name AS creator_name
      FROM events
      JOIN users ON events.created_by = users.id
      ORDER BY events.date ASC
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

// ================= REGISTER FOR EVENT =================
app.post("/api/events/:id/register", async (req, res) => {
  const eventId = req.params.id;
  const { user_id } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO registrations (event_id, user_id)
       VALUES ($1, $2)
       RETURNING *`,
      [eventId, user_id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= GET REGISTRATIONS =================
app.get("/api/registrations", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT registrations.*, users.name, events.title
      FROM registrations
      JOIN users ON registrations.user_id = users.id
      JOIN events ON registrations.event_id = events.id
      ORDER BY registrations.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= ADMIN USERS =================
app.get("/api/admin/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/admin/users/:id", async (req, res) => {
  const id = req.params.id;

  try {
    await pool.query("DELETE FROM users WHERE id=$1", [id]);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
