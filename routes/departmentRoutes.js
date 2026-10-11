const express = require("express");
const router = express.Router();
const validate = require("../middleware/validate");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const { createDepartmentSchema, updateDepartmentSchema } = require("../validators/departmentValidator");
const {
  getAllDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require("../controllers/departmentController");

router.get("/", authenticate, getAllDepartments);
router.get("/:id", authenticate, getDepartment);
router.post("/", authenticate, authorize("admin"), validate(createDepartmentSchema), createDepartment);
router.put("/:id", authenticate, authorize("admin"), validate(updateDepartmentSchema), updateDepartment);
router.delete("/:id", authenticate, authorize("admin"), deleteDepartment);

module.exports = router;