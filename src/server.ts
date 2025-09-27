import { createServer } from './app';
import { Database } from './database';
import { errorLogger, logStartup } from './utils/logger';
import { config } from 'dotenv';

config();

const server = createServer();
const port = parseInt(process.env.PORT || '5000', 10); // Render port
const env = process.env.NODE_ENV || 'development';


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
