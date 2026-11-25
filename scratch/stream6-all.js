// Streams step 6 comparison: load ALL employees with one findMany (the non-streaming way)
const prisma = require("../config/prisma");

async function main() {
  const start = Date.now();

  // One query, every row, all held in memory at once
  const employees = await prisma.employee.findMany({
    include: { department: { select: { name: true } } },
  });

  console.log(`rows: ${employees.length}`);
  console.log(`time: ${Date.now() - start} ms`);
  console.log(`heap while holding all rows: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)} MB`);

  await prisma.$disconnect();
}

main();
