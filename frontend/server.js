const { createServer } = require('http');
const next = require('next');

function readArg(name, shortName) {
  const args = process.argv.slice(2);
  const index = args.findIndex((arg) => arg === name || arg === shortName);
  if (index >= 0) return args[index + 1];
  const inline = args.find((arg) => arg.startsWith(`${name}=`) || arg.startsWith(`${shortName}=`));
  return inline ? inline.split('=').slice(1).join('=') : undefined;
}

const dev = process.env.NODE_ENV === 'development';
const hostname = process.env.HOSTNAME || readArg('--hostname', '-H') || '127.0.0.1';
const port = Number.parseInt(process.env.PORT || readArg('--port', '-p') || '3000', 10);
const shutdownTimeoutMs = Number.parseInt(process.env.SHUTDOWN_TIMEOUT_MS || '30000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

let server;
let shuttingDown = false;

async function closeDbPool() {
  if (typeof globalThis.__spraykartCloseDbPool === 'function') {
    await globalThis.__spraykartCloseDbPool();
  }
}

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  process.stdout.write(`[server] ${signal} received; draining HTTP server and database pool\n`);
  const forceExit = setTimeout(() => {
    process.stderr.write('[server] Graceful shutdown timed out; forcing exit\n');
    process.exit(1);
  }, shutdownTimeoutMs);
  forceExit.unref();

  const finish = async () => {
    try {
      await closeDbPool();
      process.stdout.write('[server] Shutdown complete\n');
      process.exit(0);
    } catch (err) {
      process.stderr.write(`[server] Shutdown failed: ${err?.message || err}\n`);
      process.exit(1);
    }
  };

  if (server) {
    server.close(finish);
  } else {
    await finish();
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

app.prepare().then(() => {
  server = createServer((req, res) => handle(req, res));
  server.listen(port, hostname, () => {
    process.stdout.write(`[server] Ready on http://${hostname}:${port}\n`);
  });
});
