const { z } = require("zod");

const createEmployeeSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .trim(),
  departmentId: z
    .string({ required_error: "Department ID is required" })
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

module.exports = { createEmployeeSchema, updateEmployeeSchema };