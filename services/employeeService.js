const Employee = require("../models/Employee");
const { invalidateEmployeeCache } = require("./cacheService");
const { employeeQueue } = require("../config/queue");

const ALLOWED_SORT_FIELDS = new Set(["name", "department", "createdAt"]);

function parseSort(sort) {
  if (!sort) return { field: "createdAt", direction: -1 };

  const field = sort.startsWith("-") ? sort.substring(1) : sort;
  const direction = sort.startsWith("-") ? -1 : 1;

  if (!ALLOWED_SORT_FIELDS.has(field)) {
    return { field: "createdAt", direction: -1 };
  }

  return { field, direction };
}

async function getAllEmployees(page = 1, limit = 10, filters = {}) {
  const skip = (page - 1) * limit;
  const sortOption = parseSort(filters.sort);

  const [employees, total] = await Promise.all([
    Employee.findAll({ filters, sortOption, skip, limit }),
    Employee.count(filters),
  ]);

  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    data: employees,
  };
}

async function getEmployeeById(id) {
  return await Employee.findById(id);
}

async function createEmployee(name, department) {
  const saved = await Employee.create({ name, department });
  await invalidateEmployeeCache();

  await employeeQueue.add("send-welcome-email", {
    name: saved.name,
    department: saved.department,
    employeeId: saved.id,
  });

  return saved;
}

async function deleteEmployeeById(id) {
  const result = await Employee.deleteById(id);
  if (result) {
    await invalidateEmployeeCache();
    await employeeQueue.add("log-employee-deleted", {
      employeeId: result.id,
      name: result.name,
      department: result.department,
    });
  }
  return result;
}

async function updateEmployeeById(id, updates) {
  const updated = await Employee.updateById(id, updates);
  if (updated) await invalidateEmployeeCache();
  return updated;
}

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  deleteEmployeeById,
  updateEmployeeById,
};
