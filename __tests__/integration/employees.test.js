const { randomUUID } = require("crypto");
const request = require("supertest");
const app = require("../../app");
const prisma = require("../../config/prisma");
const authService = require("../../services/authService");

let adminToken;
let userToken;
let hr;
let engineering;

async function clearDatabase() {
  await prisma.employee.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();
}

beforeAll(async () => {
  await clearDatabase();

  await authService.register("testadmin", "password123", "admin");
  await authService.register("testuser", "password123", "user");
  adminToken = (await authService.login("testadmin", "password123")).token;
  userToken = (await authService.login("testuser", "password123")).token;

  hr = await prisma.department.create({ data: { name: "HR" } });
  engineering = await prisma.department.create({ data: { name: "Engineering" } });
});

afterEach(async () => {
  await prisma.employee.deleteMany();
});

afterAll(async () => {
  await clearDatabase();
  await prisma.$disconnect();
});

async function seedTwoEmployees() {
  await prisma.employee.createMany({
    data: [
      { name: "Alice", departmentId: hr.id },
      { name: "Bob", departmentId: engineering.id },
    ],
  });
}

describe("GET /api/v1/employees", () => {
  test("returns 401 without a token", async () => {
    const res = await request(app).get("/api/v1/employees");
    expect(res.status).toBe(401);
  });

  test("returns employee list for authenticated user", async () => {
    await seedTwoEmployees();

    const res = await request(app)
      .get("/api/v1/employees")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.total).toBe(2);
  });

  test("filters by department", async () => {
    await seedTwoEmployees();

    const res = await request(app)
      .get("/api/v1/employees?department=HR")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Alice");
  });

  // Regression: validated query values used to be discarded, so limit reached Prisma as text → 500
  test("accepts a valid limit and returns numbers for page and limit", async () => {
    await seedTwoEmployees();

    const res = await request(app)
      .get("/api/v1/employees?limit=1&page=2")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.page).toBe(2);
    expect(res.body.limit).toBe(1);
    expect(res.body.data).toHaveLength(1);
  });

  test("uses default page and limit when not provided", async () => {
    const res = await request(app)
      .get("/api/v1/employees")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(10);
  });

  test("sorts by name descending", async () => {
    await seedTwoEmployees();

    const res = await request(app)
      .get("/api/v1/employees?sort=-name")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.map((e) => e.name)).toEqual(["Bob", "Alice"]);
  });

  test.each([
    ["limit above 100", "limit=1000000"],
    ["limit below 1", "limit=0"],
    ["unknown sort field", "sort=salary"],
    ["search longer than 100 characters", `search=${"a".repeat(101)}`],
    ["department longer than 100 characters", `department=${"a".repeat(101)}`],
  ])("returns 400 for %s", async (_label, query) => {
    const res = await request(app)
      .get(`/api/v1/employees?${query}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
  });

  test("accepts a search of exactly 100 characters", async () => {
    const res = await request(app)
      .get(`/api/v1/employees?search=${"a".repeat(100)}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
  });
});

describe("POST /api/v1/employees", () => {
  test("returns 401 without token", async () => {
    const res = await request(app)
      .post("/api/v1/employees")
      .send({ name: "Alice", departmentId: hr.id });
    expect(res.status).toBe(401);
  });

  test("returns 403 for non-admin user", async () => {
    const res = await request(app)
      .post("/api/v1/employees")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "Alice", departmentId: hr.id });
    expect(res.status).toBe(403);
  });

  test("creates employee successfully as admin", async () => {
    const res = await request(app)
      .post("/api/v1/employees")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Alice", departmentId: hr.id });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Alice");
    expect(res.body.department.name).toBe("HR");
  });

  test("returns 400 with a clear message for missing name", async () => {
    const res = await request(app)
      .post("/api/v1/employees")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ departmentId: hr.id });

    expect(res.status).toBe(400);
    expect(res.body.details[0].message).toBe("Name is required");
  });

  test("returns 404 when the department does not exist", async () => {
    const res = await request(app)
      .post("/api/v1/employees")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Alice", departmentId: randomUUID() });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/v1/employees/:id", () => {
  test("returns 404 for non-existent employee", async () => {
    const res = await request(app)
      .delete(`/api/v1/employees/${randomUUID()}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  test("deletes existing employee successfully", async () => {
    const employee = await prisma.employee.create({
      data: { name: "Alice", departmentId: hr.id },
    });

    const res = await request(app)
      .delete(`/api/v1/employees/${employee.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    const deleted = await prisma.employee.findUnique({ where: { id: employee.id } });
    expect(deleted).toBeNull();
  });
});
