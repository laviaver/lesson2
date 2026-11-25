// Streams step 5: stop cleanly when the client hangs up — by hand vs with pipeline
const express = require("express");
const { Readable } = require("stream");
const { pipeline } = require("stream/promises");
const { once } = require("events");
const app = express();

const ROWS = 110000;

// Same fake employee row as before
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

// How many downloads have started but not finished their cleanup
let inProgress = 0;

app.get("/stats", (req, res) => {
  res.json({ inProgress });
});

// Version A: our loop, fixed by hand
app.get("/manual", async (req, res) => {
  inProgress++;
  res.setHeader("Content-Type", "application/x-ndjson");

  // A promise that settles when the connection closes, for any reason
  const closed = new Promise((resolve) => res.once("close", resolve));

  try {
    for (let i = 1; i <= ROWS; i++) {
      const ok = res.write(JSON.stringify(fakeEmployee(i)) + "\n");
      if (!ok) {
        // Wait for whichever comes first: outbox drained, or connection closed
        await Promise.race([once(res, "drain"), closed]);
        if (res.destroyed) {
          console.log(`/manual client gone at row ${i}, stopping`);
          break;
        }
      }
    }
    res.end();
  } finally {
    // Runs no matter how we leave the try block
    inProgress--;
    console.log(`/manual cleanup done (in progress: ${inProgress})`);
  }
});

// Version B: the standard way
// A generator: hands out one row each time it's asked, instead of building them all up front
function* employeeRows() {
  for (let i = 1; i <= ROWS; i++) {
    yield JSON.stringify(fakeEmployee(i)) + "\n";
  }
}

app.get("/pipeline", async (req, res) => {
  inProgress++;
  res.setHeader("Content-Type", "application/x-ndjson");

  try {
    // Connect source → destination; pipeline handles backpressure and hang-ups
    await pipeline(Readable.from(employeeRows()), res);
    console.log("/pipeline finished sending");
  } catch (err) {
    console.log(`/pipeline stopped early: ${err.code}`);
  } finally {
    inProgress--;
    console.log(`/pipeline cleanup done (in progress: ${inProgress})`);
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Stream test server on http://localhost:${PORT}`));
