// Streams step 4: what happens when the client hangs up halfway?
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

// How many /drip requests have started but not finished yet
let inProgress = 0;

app.get("/stats", (req, res) => {
  res.json({ inProgress });
});

// Same as step 3, plus logging
app.get("/drip", async (req, res) => {
  inProgress++;
  console.log(`/drip start (in progress: ${inProgress})`);
  res.setHeader("Content-Type", "application/x-ndjson");

  // "close" fires when the connection ends, for any reason
  res.on("close", () => console.log(`/drip connection closed (finished sending: ${res.writableFinished})`));

  for (let i = 1; i <= ROWS; i++) {
    const ok = res.write(JSON.stringify(fakeEmployee(i)) + "\n");
    if (!ok) {
      await once(res, "drain");
    }
  }

  res.end();
  inProgress--;
  console.log(`/drip done (in progress: ${inProgress})`);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Stream test server on http://localhost:${PORT}`));
