const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const STATE_FILE = path.join(DATA_DIR, "state.json");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

let state = null;
let writeChain = Promise.resolve();

function readStateFile() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
  } catch (err) {
    console.warn("无法读取 state.json，使用空初始数据", err.message);
    return { departments: [], sessions: [], hosts: [], organizers: [], settings: {}, cursors: {} };
  }
}

function persistState(nextState) {
  writeChain = writeChain.then(async () => {
    const tmp = STATE_FILE + ".tmp";
    await fs.promises.writeFile(tmp, JSON.stringify(nextState, null, 2), "utf-8");
    await fs.promises.rename(tmp, STATE_FILE);
  }).catch((err) => {
    console.error("保存 state.json 失败", err);
  });
  return writeChain;
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function readBody(req, limit = 8 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error("body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

async function handleApi(req, res, url) {
  if (url.pathname === "/api/health") {
    sendJson(res, 200, { ok: true, stateFile: STATE_FILE });
    return true;
  }
  if (url.pathname === "/api/state" && req.method === "GET") {
    sendJson(res, 200, state);
    return true;
  }
  if (url.pathname === "/api/state" && req.method === "POST") {
    try {
      const body = await readBody(req);
      const next = JSON.parse(body);
      if (!next || !Array.isArray(next.departments) || !Array.isArray(next.sessions)) {
        sendJson(res, 400, { error: "缺少 departments 或 sessions" });
        return true;
      }
      next.meta = next.meta || {};
      next.meta.serverUpdatedAt = new Date().toISOString();
      state = next;
      await persistState(next);
      sendJson(res, 200, { ok: true, updatedAt: next.meta.serverUpdatedAt });
    } catch (err) {
      sendJson(res, 400, { error: "数据格式错误" });
    }
    return true;
  }
  return false;
}

async function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";
  const filePath = path.normalize(path.join(PUBLIC_DIR, pathname));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  try {
    const data = await fs.promises.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    res.end(data);
  } catch (err) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found");
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  try {
    if (url.pathname.startsWith("/api/")) {
      if (await handleApi(req, res, url)) return;
    }
    await serveStatic(req, res, url);
  } catch (err) {
    console.error(err);
    sendJson(res, 500, { error: "server error" });
  }
});

state = readStateFile();
server.listen(PORT, () => {
  console.log(`面试官轮值排班台服务已启动：http://localhost:${PORT}`);
  console.log(`数据文件：${STATE_FILE}`);
});
