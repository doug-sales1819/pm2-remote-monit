const http = require("http");

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");
  throw new Error("This is a test error");
  res.end("Hello, world!");
});

server.listen(3000, "localhost", () => {
  process.send("ready");
  console.log("Server running at http://localhost:3000/");
});
