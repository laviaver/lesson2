require("dotenv").config();
const app = require("./app");
const prisma = require("./config/prisma");
const logger = require("./utils/logger");

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await prisma.$connect();
    logger.info("PostgreSQL connected");

    app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    logger.error("Failed to start server", { error: err.message });
    process.exit(1);
  }
}

startServer();