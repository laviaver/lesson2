// Streams step 1: "send it all at the end" vs "send it piece by piece"
const express = require("express");
const app = express();

// Helper: wait ms milliseconds WITHOUT blocking (the cashier is free meanwhile)
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Version A: build the whole answer first, send it once at the end
app.get("/all", async (req, res) => {
  let body = "";
  for (let i = 1; i <= 5; i++) {
    await wait(1000);              // pretend each row takes 1 second to fetch
    body += `row ${i}\n`;          // keep adding to one big string in memory
  }
  res.send(body);                  // one single delivery
});

// Version B: send each row the moment it is ready
app.get("/drip", async (req, res) => {
  res.setHeader("Content-Type", "text/plain");
  for (let i = 1; i <= 5; i++) {
    await wait(1000);
    res.write(`row ${i}\n`);       // hand this piece to the client NOW
  }
  res.end();                       // tell the client "that's everything"
});

app.listen(4000, () => console.log("Stream test server on http://localhost:4000"));
