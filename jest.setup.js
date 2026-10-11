process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@127.0.0.1:5433/employee_api_test";
process.env.REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
process.env.REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
process.env.REDIS_PORT = process.env.REDIS_PORT || "6379";
