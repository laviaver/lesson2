const prisma = require("../config/prisma");

async function main() {
  let start = Date.now();
  const employees = await prisma.employee.findMany({ include: { department: true } });
  console.log("1. Fetched", employees.length, "employees in", Date.now() - start, "ms");

  start = Date.now();
  const json = JSON.stringify(employees);
  console.log("2. Converted to JSON in", Date.now() - start, "ms (cashier blocked)");

  console.log("3. Response size:", (json.length / 1024 / 1024).toFixed(1), "MB");

  await prisma.$disconnect();
}

main();