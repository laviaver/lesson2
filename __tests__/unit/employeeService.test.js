jest.mock("../../models/Employee");
jest.mock("../../services/cacheService");
jest.mock("../../config/queue");

const Employee = require("../../models/Employee");
const { invalidateEmployeeCache } = require("../../services/cacheService");
const { employeeQueue } = require("../../config/queue");
const employeeService = require("../../services/employeeService");

describe("employeeService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllEmployees", () => {
    test("returns paginated results with defaults", async () => {
      const mockEmployees = [
        { id: "1", name: "Alice", department: "HR" },
        { id: "2", name: "Bob", department: "Engineering" },
      ];

      Employee.findAll.mockResolvedValue(mockEmployees);
      Employee.count.mockResolvedValue(2);

      const result = await employeeService.getAllEmployees();

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    test("applies department filter when provided", async () => {
      Employee.findAll.mockResolvedValue([]);
      Employee.count.mockResolvedValue(0);

      await employeeService.getAllEmployees(1, 10, { department: "HR" });

      expect(Employee.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({ department: "HR" }),
        })
      );
    });
  });

  describe("createEmployee", () => {
    test("saves employee and invalidates cache", async () => {
      const mockSaved = { id: "123", name: "Alice", department: "HR" };
      Employee.create.mockResolvedValue(mockSaved);
      invalidateEmployeeCache.mockResolvedValue();
      employeeQueue.add.mockResolvedValue();

      const result = await employeeService.createEmployee("Alice", "HR");

      expect(Employee.create).toHaveBeenCalledWith({
        name: "Alice",
        department: "HR",
      });
      expect(invalidateEmployeeCache).toHaveBeenCalled();
      expect(employeeQueue.add).toHaveBeenCalledWith(
        "send-welcome-email",
        expect.objectContaining({ name: "Alice", department: "HR" })
      );
      expect(result).toEqual(mockSaved);
    });
  });

  describe("deleteEmployeeById", () => {
    test("deletes employee, invalidates cache, and queues audit job", async () => {
      const mockEmployee = { id: "123", name: "Alice", department: "HR" };
      Employee.deleteById.mockResolvedValue(mockEmployee);
      invalidateEmployeeCache.mockResolvedValue();
      employeeQueue.add.mockResolvedValue();

      const result = await employeeService.deleteEmployeeById("123");

      expect(result).toEqual(mockEmployee);
      expect(invalidateEmployeeCache).toHaveBeenCalled();
      expect(employeeQueue.add).toHaveBeenCalledWith(
        "log-employee-deleted",
        expect.objectContaining({ employeeId: "123" })
      );
    });

    test("does not invalidate cache if employee not found", async () => {
      Employee.deleteById.mockResolvedValue(null);

      await employeeService.deleteEmployeeById("nonexistent");

      expect(invalidateEmployeeCache).not.toHaveBeenCalled();
    });
  });
});
