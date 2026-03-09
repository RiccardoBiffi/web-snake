import { createReadStream, existsSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, extname, isAbsolute, join, normalize, relative } from "node:path";
import { createServer } from "node:http";
import { networkInterfaces } from "node:os";

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

export const defaultRoot = normalize(join(dirname(fileURLToPath(import.meta.url)), ".."));

export function createRequestHandler(root = defaultRoot) {
  const normalizedRoot = normalize(root);

  return (request, response) => {
    const pathname = request.url?.split("?")[0] ?? "/";
    const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    let filePath = normalize(join(normalizedRoot, relativePath));
    const relativeToRoot = relative(normalizedRoot, filePath);

    if (relativeToRoot.startsWith("..") || isAbsolute(relativeToRoot)) {
      response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Forbidden");
      return;
    }

    if (existsSync(filePath) && statSync(filePath).isDirectory()) {
      filePath = join(filePath, "index.html");
    }

    if (!existsSync(filePath)) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const extension = extname(filePath);
    const contentType = MIME_TYPES[extension] ?? "application/octet-stream";

    response.writeHead(200, { "Content-Type": contentType });
    createReadStream(filePath).pipe(response);
  };
}

export function startServer({
  root = defaultRoot,
  port = Number(process.env.PORT ?? 3000),
  host = process.env.HOST ?? "0.0.0.0"
} = {}) {
  const server = createServer(createRequestHandler(root));

  server.listen(port, host, () => {
    for (const url of getServerUrls(host, port)) {
      console.log(`Snake dev server running at ${url}`);
    }
  });

  return server;
}

export function getServerUrls(listenHost, listenPort) {
  if (listenHost !== "0.0.0.0" && listenHost !== "::") {
    return [formatUrl(listenHost, listenPort)];
  }

  const urls = new Set([formatUrl("127.0.0.1", listenPort)]);

  for (const addresses of Object.values(networkInterfaces())) {
    for (const address of addresses ?? []) {
      if (address.internal || address.family !== "IPv4") {
        continue;
      }

      urls.add(formatUrl(address.address, listenPort));
    }
  }

  return Array.from(urls);
}

function formatUrl(address, listenPort) {
  return `http://${address}:${listenPort}`;
}

if (isMainModule()) {
  startServer();
}

function isMainModule() {
  return process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;
}
