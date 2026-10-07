require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const { PrismaClient } = require("../generated/prisma");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  max: 10,        // maximum connections in the pool
  idleTimeoutMillis: 30000,   // close idle connections after 30s
  connectionTimeoutMillis: 2000, // fail if can't get connection in 2s
});

const prisma = new PrismaClient({ adapter });

module.exports = prisma;
