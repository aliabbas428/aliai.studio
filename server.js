const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const root = path.join(__dirname, "web");

const server = http.createServer((req, res) => {
  let pathname = decodeURIComponent(new URL(req.url, `http://localhost:${PORT}`).pathname);
  if (pathname === "/") pathname = "/index.html";

  const file = path.join(root, pathname);
  if (!file.startsWith(root)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, {"Content-Type": "text/plain; charset=utf-8"});
      return res.end("Not found");
    }
    const ext = path.extname(file);
    const types = {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "text/javascript; charset=utf-8"
    };
    res.writeHead(200, {"Content-Type": types[ext] || "application/octet-stream"});
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`AliAI Studio running on http://localhost:${PORT}`);
});
