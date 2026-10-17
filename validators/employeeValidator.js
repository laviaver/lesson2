const { z } = require("zod");

const createEmployeeSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .trim(),
  departmentId: z
    .string({ error: "Department ID is required" })
    .uuid("Department ID must be a valid UUID"),
});

const updateEmployeeSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name cannot exceed 100 characters")
      .trim()
      .optional(),
    departmentId: z
      .string()
      .uuid("Department ID must be a valid UUID")
      .optional(),
  })
  .refine(
    (data) => data.name !== undefined || data.departmentId !== undefined,
    { message: "At least one field (name or departmentId) must be provided" }
  );

const listEmployeesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  department: z.string().trim().max(100, "Department cannot exceed 100 characters").optional(),
  search: z.string().trim().max(100, "Search cannot exceed 100 characters").optional(),
  sort: z
  .enum(["name", "-name", "createdAt", "-createdAt"], {
    message: "Sort must be one of: name, -name, createdAt, -createdAt",
  })
  .optional(),
});

module.exports = {
  createEmployeeSchema,
  updateEmployeeSchema,
  listEmployeesQuerySchema,
};