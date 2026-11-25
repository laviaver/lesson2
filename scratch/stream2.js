// Streams step 2: how much memory does each approach hold with 110,000 rows?
const express = require("express");
const app = express();

const ROWS = 110000;

// A fake employee row, roughly the size of a real one
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

// Helper: current heap memory (where JavaScript keeps strings/objects) in MB
const heapMB = () => (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);

// Version A: build one giant string, then send it
app.get("/all", (req, res) => {
  console.log(`/all  start: heap ${heapMB()} MB`);
  let body = "";
  for (let i = 1; i <= ROWS; i++) {
    body += JSON.stringify(fakeEmployee(i)) + "\n";
  }
  console.log(`/all  peak:  heap ${heapMB()} MB  (body is ${(body.length / 1024 / 1024).toFixed(1)} MB)`);
  res.send(body);
});

// Version B: res.write each row as soon as it's made
app.get("/drip", (req, res) => {
  console.log(`/drip start: heap ${heapMB()} MB`);
  res.setHeader("Content-Type", "application/x-ndjson");
  for (let i = 1; i <= ROWS; i++) {
    res.write(JSON.stringify(fakeEmployee(i)) + "\n");
  }
  // writableLength = bytes we've handed to res.write that haven't actually gone out yet
  console.log(`/drip peak:  heap ${heapMB()} MB  (waiting to be sent: ${(res.writableLength / 1024 / 1024).toFixed(1)} MB)`);
  res.end();
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Stream test server on http://localhost:${PORT}`));
