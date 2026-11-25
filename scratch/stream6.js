// Streams step 6: read all employees from the real database in batches (no HTTP yet)
const prisma = require("../config/prisma");

const BATCH_SIZE = 1000;

// An async generator: hands out one batch at a time, fetching it from the DB only when asked
async function* employeeBatches() {
  let lastId = null;

  while (true) {
    const batch = await prisma.employee.findMany({
      where: lastId ? { id: { gt: lastId } } : {},   // "the ones after the last one I gave you"
      orderBy: { id: "asc" },
      take: BATCH_SIZE,
      include: { department: { select: { name: true } } },
    });

    if (batch.length === 0) return;   // nothing left: the dispenser is empty

    lastId = batch[batch.length - 1].id;
    yield batch;
  }
}

async function main() {
  const start = Date.now();
  let batches = 0;
  let rows = 0;
  let peakHeap = 0;

  // for await: ask the dispenser for the next batch, wait for it, repeat until empty
  for await (const batch of employeeBatches()) {
    batches++;
    rows += batch.length;
    peakHeap = Math.max(peakHeap, process.memoryUsage().heapUsed);
  }

  console.log(`batches: ${batches}`);
  console.log(`rows: ${rows}`);
  console.log(`time: ${Date.now() - start} ms`);
  console.log(`peak heap: ${(peakHeap / 1024 / 1024).toFixed(1)} MB`);

  await prisma.$disconnect();   // close the pool so the script can exit
}

main();
