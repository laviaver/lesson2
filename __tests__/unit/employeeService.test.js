jest.mock("../../config/prisma", () => ({
  employee: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
}));

const prisma = require("../../config/prisma");
const employeeService = require("../../services/employeeService");
const { NotFoundError } = require("../../errors");

describe("employeeService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllEmployees", () => {
    test("returns paginated results with defaults", async () => {
      const mockEmployees = [
        { id: "1", name: "Alice", department: { name: "HR" } },
        { id: "2", name: "Bob", department: { name: "Engineering" } },
      ];

      prisma.employee.findMany.mockResolvedValue(mockEmployees);
      prisma.employee.count.mockResolvedValue(2);

      const result = await employeeService.getAllEmployees();

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(prisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          orderBy: { createdAt: "desc" },
          include: { department: true },
        })
      );
    });

    test("applies department filter when provided", async () => {
      prisma.employee.findMany.mockResolvedValue([]);
      prisma.employee.count.mockResolvedValue(0);

      await employeeService.getAllEmployees(1, 10, { department: "HR" });

      expect(prisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            department: {
              name: { equals: "HR", mode: "insensitive" },
            },
          }),
        })
      );
    });
  });

  describe("createEmployee", () => {
    test("creates an employee in the given department", async () => {
      const mockSaved = {
        id: "123",
        name: "Alice",
        departmentId: "dept-1",
        department: { name: "HR" },
      };
      prisma.employee.create.mockResolvedValue(mockSaved);

      const result = await employeeService.createEmployee("Alice", "dept-1");

      expect(prisma.employee.create).toHaveBeenCalledWith({
        data: { name: "Alice", departmentId: "dept-1" },
        include: { department: true },
      });
      expect(result).toEqual(mockSaved);
    });

    test("throws when the department does not exist", async () => {
      prisma.employee.create.mockRejectedValue({ code: "P2003" });

      await expect(
        employeeService.createEmployee("Alice", "missing")
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("deleteEmployeeById", () => {
    test("deletes an existing employee", async () => {
      const mockEmployee = { id: "123", name: "Alice", departmentId: "dept-1" };
      prisma.employee.delete.mockResolvedValue(mockEmployee);

      const result = await employeeService.deleteEmployeeById("123");

      expect(result).toEqual(mockEmployee);
      expect(prisma.employee.delete).toHaveBeenCalledWith({ where: { id: "123" } });
    });

    test("throws when the employee does not exist", async () => {
      prisma.employee.delete.mockRejectedValue({ code: "P2025" });

      await expect(
        employeeService.deleteEmployeeById("nonexistent")
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
