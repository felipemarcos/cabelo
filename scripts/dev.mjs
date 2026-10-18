// Rebuilds the library on change and serves the examples on http://localhost:8080
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { watch } from 'rollup';
import config from '../rollup.config.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT) || 8080;

const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg'
};

watch(config).on('event', (event) => {
  if (event.code === 'BUNDLE_END') {
    console.log(`Built in ${event.duration}ms`);
    event.result.close();
  }

  if (event.code === 'ERROR') {
    console.error(event.error.message);
  }
});

http
  .createServer((req, res) => {
    let file = path.join(root, decodeURIComponent(new URL(req.url, 'http://localhost').pathname));

    if (!file.startsWith(root)) {
      res.writeHead(403).end();
      return;
    }

    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      file = path.join(file, 'index.html');
    }

    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404).end('Not found');
        return;
      }

      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    });
  })
  .listen(port, () => {
    console.log(`Examples running on http://localhost:${port}/examples/`);
  });
