const SHARED_SECRET = "wl5WJhCBavg9AaqXrwDWuWa93sB6vMdH";
const TARGET = "https://clob.polymarket.com";

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

export default async function handler(req, res) {
  if (req.headers["x-proxy-secret"] !== SHARED_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const targetUrl = TARGET + url.pathname.replace("/api/proxy", "") + url.search;

  const headers = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (key.toLowerCase() !== "x-proxy-secret" && key.toLowerCase() !== "host") {
      headers[key] = value;
    }
  }

  const body = req.method !== "GET" && req.method !== "HEAD" ? await readBody(req) : undefined;

  const response = await fetch(targetUrl, {
    method: req.method,
    headers: headers,
    body: body && body.length > 0 ? body : undefined,
  });

  const data = await response.arrayBuffer();
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.status(response.status).end(Buffer.from(data));
}
