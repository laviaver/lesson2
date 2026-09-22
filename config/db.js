const { Pool } = require("pg");
const path = require("path");
const logger = require("../utils/logger");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString:
        process.env.DATABASE_URL ||
        "postgres://postgres:postgres@127.0.0.1:5433/employee_db",
    });
  }
  return pool;
}

async function connectDB() {
  try {
    await getPool().query("SELECT 1");
    logger.info("PostgreSQL connected");
  } catch (err) {
    logger.error("PostgreSQL connection failed", {
      error: err.message,
      stack: err.stack,
    });
    process.exit(1);
  }
}

async function closeDB() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

async function isConnected() {
  try {
    await getPool().query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

module.exports = { connectDB, getPool, closeDB, isConnected };
