const path = require("path");

require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true });

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

// Tests delete and recreate data, so they must never run against the real database.
// Use TEST_DATABASE_URL if set; otherwise use DATABASE_URL with "_test" added to the database name.
function resolveTestDatabaseUrl() {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  if (!process.env.DATABASE_URL) {
    throw new Error("Set TEST_DATABASE_URL or DATABASE_URL before running tests");
  }
  const url = new URL(process.env.DATABASE_URL);
  url.pathname = `${url.pathname}_test`;
  return url.toString();
}

const testDatabaseUrl = resolveTestDatabaseUrl();
const dbName = new URL(testDatabaseUrl).pathname.slice(1);
if (!dbName.endsWith("_test")) {
  throw new Error(`Refusing to run tests: database "${dbName}" does not end with "_test"`);
}
process.env.DATABASE_URL = testDatabaseUrl;

process.env.REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
process.env.REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
process.env.REDIS_PORT = process.env.REDIS_PORT || "6379";
