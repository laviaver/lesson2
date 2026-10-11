const departmentService = require("../services/departmentService");
const asyncHandler = require("../middleware/asyncHandler");
const { NotFoundError } = require("../errors");

const getAllDepartments = asyncHandler(async (req, res) => {
  const departments = await departmentService.getAllDepartments();
  res.json(departments);
});

const getDepartment = asyncHandler(async (req, res) => {
  const department = await departmentService.getDepartmentById(req.params.id);
  if (!department) throw new NotFoundError("Department not found");
  res.json(department);
});

const createDepartment = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const department = await departmentService.createDepartment(name);
  res.status(201).json(department);
});

const updateDepartment = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const department = await departmentService.updateDepartmentById(req.params.id, name);
  res.json(department);
});

const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await departmentService.deleteDepartmentById(req.params.id);
  res.json({ message: "Department deleted", id: department.id });
});

module.exports = {
  getAllDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};