const express = require("express");
const app = express();
const port = 3000;
const cors = require("cors");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sqlite3 = require("sqlite3").verbose();

let db = new sqlite3.Database(":memory:", (err) => {
  if (err) return console.error(err.message);
  console.log("Connected to the in-memory SQLite database.");
});

const createTableQuery = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  pass TEXT
)
`;

// Run the SQL query to create the table
db.serialize(() => {
  db.run(createTableQuery, (err) => {
    if (err) {
      console.error("Error creating table:", err.message);
    } else {
      console.log("Table =>users<= created successfully");
    }
  });
});

// Signup API
app.post("/signup", (req, res) => {
  const { email, pass } = req.body;

  if (!email || !pass) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const insertQuery = "INSERT INTO users (email, pass) VALUES (?, ?)";
  db.run(insertQuery, [email, pass], function (err) {
    if (err) {
      console.error("Error signing up user:", err.message);
      return res
        .status(500)
        .json({ error: "Failed to sign up. Email might already exist." });
    }
    res.status(201).json({ message: "Signup successful!", id: this.lastID });
  });
});

// Login API
app.post("/login", (req, res) => {
  const { email, pass } = req.body;

  if (!email || !pass) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const selectQuery = "SELECT id FROM users WHERE email = ? AND pass = ?";
  db.get(selectQuery, [email, pass], (err, row) => {
    if (err) {
      console.error("Error logging in:", err.message);
      return res.status(500).json({ error: "Failed to log in." });
    }
    if (!row) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    res.json({ message: "Login successful!", userId: row.id });
  });
});

// API to get all users
app.get("/users", (req, res) => {
  const selectQuery = "SELECT * FROM users";
  db.all(selectQuery, [], (err, rows) => {
    if (err) {
      console.error("Error retrieving users:", err.message);
      return res.status(500).json({ error: "Failed to retrieve users." });
    }
    res.json(rows);
  });
});

// API to get a specific user by ID
app.get("/users/:id", (req, res) => {
  const { id } = req.params;
  const selectQuery = "SELECT * FROM users WHERE id = ?";
  db.get(selectQuery, [id], (err, row) => {
    if (err) {
      console.error("Error retrieving user:", err.message);
      return res.status(500).json({ error: "Failed to retrieve user." });
    }
    if (!row) {
      return res.status(404).json({ error: "User not found." });
    }
    res.json(row);
  });
});

// API to delete a user by ID
app.delete("/users/:id", (req, res) => {
  const { id } = req.params;
  const deleteQuery = "DELETE FROM users WHERE id = ?";
  db.run(deleteQuery, [id], function (err) {
    if (err) {
      console.error("Error deleting user:", err.message);
      return res.status(500).json({ error: "Failed to delete user." });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "User not found." });
    }
    res.status(200).json({ message: "User deleted successfully." });
  });
});

// Default route
app.get("/", (req, res) => {
  res.send("Welcome to the Users API!.. You can see the details of this api on https://my-api.freesite.online/");
});

// Start the server
app.listen(port, () => {
  console.log(`The Server is live on http://localhost:${port}`);
});
