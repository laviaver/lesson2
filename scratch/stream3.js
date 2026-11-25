// Streams step 3: respect backpressure — stop writing when the outbox is full
const express = require("express");
const { once } = require("events");
const app = express();

const ROWS = 110000;

// Same fake employee row as step 2
function fakeEmployee(i) {
  return {
    id: i,
    name: `Employee Number ${i}`,
    email: `employee${i}@example.com`,
    role: "user",
    departmentId: (i % 20) + 1,
    salary: 50000 + (i % 1000),
    address: "123 Some Long Street Name, Some City, Some Country 12345",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

const MB = (bytes) => (bytes / 1024 / 1024).toFixed(2);

app.get("/drip", async (req, res) => {
  res.setHeader("Content-Type", "application/x-ndjson");
  console.log(`/drip start: heap ${MB(process.memoryUsage().heapUsed)} MB, outbox limit ${MB(res.writableHighWaterMark)} MB`);

  let pauses = 0;
  let biggestOutbox = 0;
  let biggestHeap = 0;

  for (let i = 1; i <= ROWS; i++) {
    // res.write returns false when the outbox is over its limit ("please stop")
    const ok = res.write(JSON.stringify(fakeEmployee(i)) + "\n");

    if (!ok) {
      pauses++;
      biggestOutbox = Math.max(biggestOutbox, res.writableLength);
      biggestHeap = Math.max(biggestHeap, process.memoryUsage().heapUsed);
      // Step away from the counter until the outbox has emptied ("drain")
      await once(res, "drain");
    }
  }

  res.end();
  console.log(`/drip done: paused ${pauses} times, biggest outbox ${MB(biggestOutbox)} MB, biggest heap ${MB(biggestHeap)} MB`);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Stream test server on http://localhost:${PORT}`));
