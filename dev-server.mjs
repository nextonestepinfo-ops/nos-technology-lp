import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const hostArg = args.find((arg) => arg.startsWith("--host="));
const hostFlagIndex = args.indexOf("--host");
const host = hostArg
  ? hostArg.slice("--host=".length)
  : hostFlagIndex >= 0
    ? args[hostFlagIndex + 1]
    : "127.0.0.1";
const portArg = args.find((arg) => arg.startsWith("--port="));
const portFlagIndex = args.indexOf("--port");
const port = Number(
  process.env.PORT ||
    (portArg ? portArg.slice("--port=".length) : portFlagIndex >= 0 ? args[portFlagIndex + 1] : 5500)
);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

function send(res, status, body, contentType = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "content-type": contentType,
    "cache-control": "no-store",
  });
  res.end(body);
}

function resolvePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const cleanPath = decoded === "/" ? "/index.html" : decoded;
  const filePath = path.resolve(root, `.${cleanPath}`);
  return filePath.startsWith(root) ? filePath : null;
}

const server = createServer(async (req, res) => {
  if (!req.url || req.method !== "GET") {
    send(res, 405, "Method not allowed");
    return;
  }

  const filePath = resolvePath(req.url);
  if (!filePath) {
    send(res, 403, "Forbidden");
    return;
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile()) {
      send(res, 404, "Not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "content-type": types[ext] || "application/octet-stream",
      "cache-control": "no-store",
    });
    createReadStream(filePath).pipe(res);
  } catch {
    send(res, 404, "Not found");
  }
});

server.listen(port, host, () => {
  const shownHost = host === "0.0.0.0" ? "localhost" : host;
  console.log(`NosTechnology LP preview: http://${shownHost}:${port}/`);
  if (host === "0.0.0.0") {
    console.log("LAN preview is enabled. Use this only on a trusted network.");
  }
});
