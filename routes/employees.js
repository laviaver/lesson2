const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");
const {
  createEmployeeSchema,
  updateEmployeeSchema,
  listEmployeesQuerySchema,
} = require("../validators/employeeValidator");
const {
  getAllEmployees,
  exportEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/employeesController");

router.get("/", authenticate, validate(listEmployeesQuerySchema, "query"), getAllEmployees);
// Must stay above "/:id", otherwise "export" would be treated as an id
router.get("/export", authenticate, authorize("admin"), exportEmployees);
router.get("/:id", authenticate, getEmployee);
router.post("/", authenticate, authorize("admin"), validate(createEmployeeSchema), createEmployee);
router.put("/:id", authenticate, authorize("admin"), validate(updateEmployeeSchema), updateEmployee);
router.delete("/:id", authenticate, authorize("admin"), deleteEmployee);

module.exports = router;
