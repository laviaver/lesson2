require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");

const employeeRoutes = require("./routes/employees");
const departmentRoutes = require("./routes/departmentRoutes");
const authRoutes = require("./routes/authRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Security & parsing
app.use(helmet());
app.use(express.json());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 429, error: "Too many requests. Please try again later." },
});

app.use(apiLimiter);

// Routes
app.get("/", (req, res) => res.send("Employee API v2 — PostgreSQL"));
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/employees", employeeRoutes);
app.use("/api/v1/departments", departmentRoutes);

// Error handler — always last
app.use(errorHandler);

module.exports = app;