import { readConfig } from './config/environment.config.js';
import { connectDatabase } from './config/database.config.js';
import { createApp } from './app.js';

const config = readConfig();
let connection;
try {
  connection = await connectDatabase(config.mongoUri);
  const app = await createApp({ config, connection, serveFrontend: !process.argv.includes('--api-only') && process.env.SERVE_FRONTEND !== '0' });
  const server = app.listen(config.port, config.host, () => console.info(`Bloom API ready at http://localhost:${config.port}/api/v1/health`));
  let stopping = false;
  const shutdown = () => {
    if (stopping) return;
    stopping = true;
    server.close(async () => { await connection.close(); process.exit(0); });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
} catch {
  // Avoid printing a URI that may contain database credentials.
  console.error('Bloom API could not start. Check backend/.env, database credentials and network access. For Atlas, check the database user and host IP access; for local MongoDB, run npm run db:dev.');
  await connection?.close();
  process.exitCode = 1;
}
