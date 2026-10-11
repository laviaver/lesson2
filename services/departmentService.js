const prisma = require("../config/prisma");
const { NotFoundError, ConflictError } = require("../errors");

// GET ALL DEPARTMENTS
async function getAllDepartments() {
  return await prisma.department.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { employees: true } } },
  });
}

// GET DEPARTMENT BY ID
async function getDepartmentById(id) {
  return await prisma.department.findUnique({
    where: { id },
    include: { employees: true },
  });
}

// CREATE DEPARTMENT
async function createDepartment(name) {
  try {
    return await prisma.department.create({
      data: { name },
    });
  } catch (err) {
    if (err.code === "P2002") {
      throw new ConflictError(`Department "${name}" already exists`);
    }
    throw err;
  }
}

// UPDATE DEPARTMENT
async function updateDepartmentById(id, name) {
  try {
    return await prisma.department.update({
      where: { id },
      data: { name },
    });
  } catch (err) {
    if (err.code === "P2025") throw new NotFoundError("Department not found");
    if (err.code === "P2002") throw new ConflictError(`Department "${name}" already exists`);
    throw err;
  }
}

// DELETE DEPARTMENT
async function deleteDepartmentById(id) {
  try {
    return await prisma.department.delete({
      where: { id },
    });
  } catch (err) {
    if (err.code === "P2025") throw new NotFoundError("Department not found");
    if (err.code === "P2003") {
      throw new ConflictError("Cannot delete department that still has employees");
    }
    throw err;
  }
}

module.exports = {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartmentById,
  deleteDepartmentById,
};