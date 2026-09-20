const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

async function setup() {
  const connectionString =
    process.env.DATABASE_URL ||
    "postgres://postgres:postgres@127.0.0.1:5432/employee_db";

  const client = new Client({ connectionString });
  await client.connect();
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await client.query(sql);
  await client.end();
  console.log("PostgreSQL schema applied");
}

setup().catch((err) => {
  console.error("Failed to apply schema:", err.message);
  process.exit(1);
});
