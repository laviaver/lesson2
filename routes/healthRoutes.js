const express = require("express");
const router = express.Router();
const { isConnected } = require("../config/db");
const { redisClient } = require("../config/redis");
const logger = require("../utils/logger");

router.get("/live", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

router.get("/ready", async (req, res) => {
  const checks = {
    postgresql: false,
    redis: false,
  };

  checks.postgresql = await isConnected();

  try {
    const reply = await redisClient.ping();
    checks.redis = reply === "PONG";
  } catch (err) {
    logger.error("Redis health check failed", { error: err.message });
    checks.redis = false;
  }

  const isReady = Object.values(checks).every((check) => check === true);
  const status = isReady ? "ok" : "degraded";
  const statusCode = isReady ? 200 : 503;

  res.status(statusCode).json({
    status,
    timestamp: new Date().toISOString(),
    checks,
  });
});

module.exports = router;
