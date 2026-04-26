import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '127.0.0.1';

const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

function sendFile(res, filePath) {
  res.writeHead(200, {
    'Content-Type': types[extname(filePath)] || 'application/octet-stream',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  });
  createReadStream(filePath).pipe(res);
}

function safePath(...parts) {
  const filePath = normalize(join(root, ...parts));
  return filePath.startsWith(root) ? filePath : null;
}

function existingFile(...parts) {
  const filePath = safePath(...parts);
  return filePath && existsSync(filePath) && statSync(filePath).isFile() ? filePath : null;
}

createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname);

  if (pathname === '/') {
    return sendFile(res, existingFile('privacy-policy.html'));
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const asset = pathname.startsWith('/admin/assets/')
      ? existingFile('Admin_Beauty_Vision', 'dist', pathname.replace('/admin/', ''))
      : null;
    return sendFile(res, asset || existingFile('Admin_Beauty_Vision', 'dist', 'index.html'));
  }

  const cleanFile = existingFile(`${pathname.slice(1)}.html`);
  const directFile = existingFile(pathname.slice(1));
  const file = cleanFile || directFile || existingFile('404.html');

  res.statusCode = file?.endsWith('404.html') ? 404 : 200;
  return sendFile(res, file);
}).listen(port, host, () => {
  console.log(`BeautyVision legal + admin running at http://${host}:${port}`);
});
