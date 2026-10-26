const start = Date.now();

console.log("A: start");

setTimeout(() => {
  console.log("B: timer, waited", Date.now() - start, "ms");
}, 0);

while (Date.now() - start < 3000) {}

console.log("C: end");