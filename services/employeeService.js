const prisma = require("../config/prisma");
const { NotFoundError } = require("../errors");

// GET ALL EMPLOYEES
async function getAllEmployees(page = 1, limit = 10, filters = {}) {
  const skip = (page - 1) * limit;

  const where = {};

  // Filter by department name
  if (filters.department) {
    where.department = {
      name: { equals: filters.department, mode: "insensitive" },
    };
  }

  // Search across name and department name
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { department: { name: { contains: filters.search, mode: "insensitive" } } },
    ];
  }

  // Sorting
  const allowedSortFields = ["name", "createdAt"];
  let orderBy = { createdAt: "desc" };

  if (filters.sort) {
    const field = filters.sort.startsWith("-") ? filters.sort.substring(1) : filters.sort;
    const direction = filters.sort.startsWith("-") ? "desc" : "asc";
    if (allowedSortFields.includes(field)) {
      orderBy = { [field]: direction };
    }
  }

  // Parallel queries
  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: { department: true },
    }),
    prisma.employee.count({ where }),
  ]);

  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    data: employees,
  };
}

// GET EMPLOYEE BY ID
async function getEmployeeById(id) {
  return await prisma.employee.findUnique({
    where: { id },
    include: { department: true },
  });
}

// CREATE EMPLOYEE
async function createEmployee(name, departmentId) {
  try {
    return await prisma.employee.create({
      data: { name, departmentId },
      include: { department: true },
    });
  } catch (err) {
    if (err.code === "P2003") {
      throw new NotFoundError("Department not found");
    }
    throw err;
  }
}

// UPDATE EMPLOYEE
async function updateEmployeeById(id, updates) {
  try {
    return await prisma.employee.update({
      where: { id },
      data: updates,
      include: { department: true },
    });
  } catch (err) {
    if (err.code === "P2025") throw new NotFoundError("Employee not found");
    if (err.code === "P2003") throw new NotFoundError("Department not found");
    throw err;
  }
}

// DELETE EMPLOYEE
async function deleteEmployeeById(id) {
  try {
    return await prisma.employee.delete({ where: { id } });
  } catch (err) {
    if (err.code === "P2025") throw new NotFoundError("Employee not found");
    throw err;
  }
}

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployeeById,
  deleteEmployeeById,
};