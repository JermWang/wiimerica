/* Minimal zero-dependency static server for LOCAL PREVIEW ONLY.
   Usage: npm run dev  →  http://localhost:5173

   This lives in tools/ deliberately. When it sat at the repo root, Vercel
   detected it as a Node entrypoint and deployed the whole site as a
   serverless function instead of static files, which 404'd every asset. */
const http = require("http");
const fs = require("fs");
const path = require("path");

// serve the repo root, one level up from tools/
const ROOT = path.dirname(__dirname);
const PORT = process.env.PORT || 5173;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".aac": "audio/aac",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2"
};

http
  .createServer((req, res) => {
    let rel;
    try {
      rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
    } catch {
      res.writeHead(400).end("Bad request");
      return;
    }
    if (rel === "/") rel = "/index.html";

    const file = path.join(ROOT, rel);
    if (!file.startsWith(ROOT)) {
      res.writeHead(403).end("Forbidden");
      return;
    }

    fs.stat(file, (err, stat) => {
      if (err || !stat.isFile()) {
        res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
        return;
      }

      const type = TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
      const range = req.headers.range;

      // Range support so <video> can seek
      if (range && /^bytes=/.test(range)) {
        const [s, e] = range.replace("bytes=", "").split("-");
        const start = parseInt(s, 10) || 0;
        const end = e ? parseInt(e, 10) : stat.size - 1;
        res.writeHead(206, {
          "Content-Type": type,
          "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": end - start + 1
        });
        fs.createReadStream(file, { start, end }).pipe(res);
        return;
      }

      res.writeHead(200, {
        "Content-Type": type,
        "Content-Length": stat.size,
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-cache"
      });
      fs.createReadStream(file).pipe(res);
    });
  })
  .listen(PORT, () => console.log(`Miimerica running at http://localhost:${PORT}`));
