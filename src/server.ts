import { createServer } from './app';
import { Database } from './database';
import { errorLogger, logStartup } from './utils/logger';
import { config } from 'dotenv';

config();

const server = createServer();
const port = parseInt(process.env.PORT || '5000', 10) // Render port
, env = process.env.NODE_ENV || 'development';

// ----------------------
// Memory monitoring
// ----------------------
setInterval(() => {
  const used = process.memoryUsage()
  , heapUsedMB = (used.heapUsed / 1024 / 1024).toFixed(2)
  , rssMB = (used.rss / 1024 / 1024).toFixed(2);
  errorLogger(new Error(`Memory usage: Heap=${heapUsedMB} MB, RSS=${rssMB} MB`), 'Memory Monitor');
}, 15000);

Database.database
  .authenticate()
  .then(async () => {
    try {
      server.listen(port, '0.0.0.0', () => {
        logStartup(port, env);
      });
    } catch (error) {
      errorLogger(error as Error, 'Server Startup');
    }
  })
  .catch((error) => {
    errorLogger(error as Error, 'Database Connection');
  });

  setInterval(() => {
  const used = process.memoryUsage(),
        heapUsedMB = (used.heapUsed / 1024 / 1024).toFixed(2),
        rssMB = (used.rss / 1024 / 1024).toFixed(2);
  errorLogger(new Error(`Memory usage: Heap=${heapUsedMB} MB, RSS=${rssMB} MB`), 'Memory Monitor');
}, 15000);
