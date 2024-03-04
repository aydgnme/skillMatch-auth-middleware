import mongoose from 'mongoose';
mongoose.set('strictQuery', false);
import { logger } from '@utils';

class Database {
  functionName: string = '';

  async startConnection() {
    this.functionName = 'ConnectDatabase';
    try {
      const dbUrl: string = process.env.DB_CONNECTION_URL!;
      if (!dbUrl) throw new Error('DB_CONNECTION_URL not found in .env file');
      let connection = await mongoose.connect(dbUrl);
      if (connection) logger.logMessage(this.functionName, 'Connected to DB');
    } catch (e: any) {
      logger.logError(this.functionName, e);
    }
  }
}

export default new Database();