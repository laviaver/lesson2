const employeeService = require("../services/employeeService");
const asyncHandler = require("../middleware/asyncHandler");
const { NotFoundError } = require("../errors");

const getAllEmployees = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, department, search, sort } = req.query;

  const result = await employeeService.getAllEmployees(
    parseInt(page),
    parseInt(limit),
    { department, search, sort }
  );

  res.json(result);
});

const getEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.getEmployeeById(req.params.id);
  if (!employee) throw new NotFoundError("Employee not found");
  res.json(employee);
});

const createEmployee = asyncHandler(async (req, res) => {
  const { name, departmentId } = req.body;
  const employee = await employeeService.createEmployee(name, departmentId);
  res.status(201).json(employee);
});

const updateEmployee = asyncHandler(async (req, res) => {
  const updated = await employeeService.updateEmployeeById(req.params.id, req.body);
  res.json(updated);
});

const deleteEmployee = asyncHandler(async (req, res) => {
  const result = await employeeService.deleteEmployeeById(req.params.id);
  res.json({ message: "Employee deleted", id: result.id });
});

module.exports = {
  getAllEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};