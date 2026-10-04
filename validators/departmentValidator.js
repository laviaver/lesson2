const { z } = require("zod");

const createDepartmentSchema = z.object({
  name: z
    .string({ required_error: "Department name is required" })
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .trim(),
});

const updateDepartmentSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .trim(),
});

module.exports = { createDepartmentSchema, updateDepartmentSchema };
