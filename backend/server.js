const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// 🔹 Replace with your Supabase connection string
const pool = new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Test route
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


const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
