const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const request = require("supertest");
const app = require("../../app");
const { connectDB, getPool, closeDB } = require("../../config/db");
const User = require("../../models/User");
const Employee = require("../../models/Employee");

let adminToken;
let userToken;

beforeAll(async () => {
  await connectDB();
  const schema = fs.readFileSync(
    path.join(__dirname, "../../db/schema.sql"),
    "utf8"
  );
  await getPool().query(schema);
  await Employee.deleteMany();
  await User.deleteMany();

  await User.create({
    username: "testadmin",
    password: "password123",
    role: "admin",
  });
  await User.create({
    username: "testuser",
    password: "password123",
    role: "user",
  });

  const adminLogin = await request(app)
    .post("/api/v1/auth/login")
    .send({ username: "testadmin", password: "password123" });
  adminToken = adminLogin.body.token;

  const userLogin = await request(app)
    .post("/api/v1/auth/login")
    .send({ username: "testuser", password: "password123" });
  userToken = userLogin.body.token;
});

afterAll(async () => {
  await Employee.deleteMany();
  await User.deleteMany();
  await closeDB();
});

afterEach(async () => {
  await Employee.deleteMany();
});

describe("GET /api/v1/employees", () => {
  test("returns 401 without a token", async () => {
    const res = await request(app).get("/api/v1/employees");
    expect(res.status).toBe(401);
  });

  test("returns employee list for authenticated user", async () => {
    await Employee.create({ name: "Alice", department: "HR" });
    await Employee.create({ name: "Bob", department: "Engineering" });

    const res = await request(app)
      .get("/api/v1/employees")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.total).toBe(2);
  });

  test("filters by department", async () => {
    await Employee.create({ name: "Alice", department: "HR" });
    await Employee.create({ name: "Bob", department: "Engineering" });

    const res = await request(app)
      .get("/api/v1/employees?department=HR")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Alice");
  });
});

describe("POST /api/v1/employees", () => {
  test("returns 401 without token", async () => {
    const res = await request(app)
      .post("/api/v1/employees")
      .send({ name: "Alice", department: "HR" });
    expect(res.status).toBe(401);
  });

  test("returns 403 for non-admin user", async () => {
    const res = await request(app)
      .post("/api/v1/employees")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "Alice", department: "HR" });
    expect(res.status).toBe(403);
  });

  test("creates employee successfully as admin", async () => {
    const res = await request(app)
      .post("/api/v1/employees")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Alice", department: "HR" });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Alice");
    expect(res.body.department).toBe("HR");
  });

  test("returns 400 for missing name", async () => {
    const res = await request(app)
      .post("/api/v1/employees")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ department: "HR" });

    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/v1/employees/:id", () => {
  test("returns 404 for non-existent employee", async () => {
    const fakeId = randomUUID();

    const res = await request(app)
      .delete(`/api/v1/employees/${fakeId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  test("deletes existing employee successfully", async () => {
    const employee = await Employee.create({
      name: "Alice",
      department: "HR",
    });

    const res = await request(app)
      .delete(`/api/v1/employees/${employee.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    const deleted = await Employee.findById(employee.id);
    expect(deleted).toBeNull();
  });
});
