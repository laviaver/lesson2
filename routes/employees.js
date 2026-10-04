const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");
const { createEmployeeSchema, updateEmployeeSchema } = require("../validators/employeeValidator");
const {
  getAllEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/employeesController");

router.get("/", authenticate, getAllEmployees);
router.get("/:id", authenticate, getEmployee);
router.post("/", authenticate, authorize("admin"), validate(createEmployeeSchema), createEmployee);
router.put("/:id", authenticate, authorize("admin"), validate(updateEmployeeSchema), updateEmployee);
router.delete("/:id", authenticate, authorize("admin"), deleteEmployee);

module.exports = router;
