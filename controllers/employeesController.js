const employeeService = require("../services/employeeService");
const asyncHandler = require("../middleware/asyncHandler");
const { NotFoundError } = require("../errors");
const logger = require("../utils/logger");
const { Readable } = require("stream");
const { pipeline } = require("stream/promises");

const getAllEmployees = asyncHandler(async (req, res) => {
  const { page, limit, department, search, sort } = req.validatedQuery;

  const result = await employeeService.getAllEmployees(page, limit, {
    department,
    search,
    sort,
  });

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

// Streams every employee as NDJSON (one JSON object per line)
const exportEmployees = asyncHandler(async (req, res) => {
  const start = Date.now();
  let rows = 0;

  // Fetch the first employee before committing to a 200 stream:
  // if the DB is down, this throws and errorHandler sends a normal JSON error
  const employees = employeeService.streamAllEmployees();
  const first = await employees.next();

  res.setHeader("Content-Type", "application/x-ndjson");
  res.setHeader("Content-Disposition", 'attachment; filename="employees.ndjson"');

  async function* toLines() {
    if (first.done) return;   // empty table: send an empty file
    rows++;
    yield JSON.stringify(first.value) + "\n";

    for await (const employee of employees) {
      rows++;
      yield JSON.stringify(employee) + "\n";
    }
  }

  try {
    await pipeline(Readable.from(toLines()), res);
    logger.info("Employee export finished", { userId: req.user.userId, rows, ms: Date.now() - start });
  } catch (err) {
    // Streaming has started, so we can't send an error response — pipeline has closed the connection
    if (err.code === "ERR_STREAM_PREMATURE_CLOSE") {
      logger.info("Employee export cancelled by client", { userId: req.user.userId, rows });
    } else {
      logger.error("Employee export failed", { userId: req.user.userId, rows, error: err.message });
    }
  }
});

module.exports = {
  getAllEmployees,
  exportEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};