const express = require("express");
const app = express();

app.get("/fast", (req, res) => {
  res.send("fast: done instantly\n");
});

app.get("/slow", async (req, res) => {
  await Promise.resolve();
  const start = Date.now();
  while (Date.now() - start < 5000) {}
  res.send("slow: done after 5 seconds\n");
});

app.listen(4000, () => console.log("Test server on http://localhost:4000"));