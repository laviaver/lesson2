const bcrypt = require("bcryptjs");
const { getPool } = require("../config/db");

function mapUser(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    username: row.username,
    password: row.password,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    comparePassword(candidatePassword) {
      return bcrypt.compare(candidatePassword, row.password);
    },
  };
}

async function findOneByUsername(username) {
  const { rows } = await getPool().query(
    "SELECT * FROM users WHERE username = $1",
    [String(username).trim().toLowerCase()]
  );
  return mapUser(rows[0]);
}

async function create({ username, password, role = "user" }) {
  const hashed = await bcrypt.hash(password, 12);
  try {
    const { rows } = await getPool().query(
      `INSERT INTO users (username, password, role)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [String(username).trim().toLowerCase(), hashed, role || "user"]
    );
    return mapUser(rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      err.isUniqueViolation = true;
    }
    throw err;
  }
}

async function deleteMany() {
  await getPool().query("DELETE FROM users");
}

module.exports = { findOneByUsername, create, deleteMany };
