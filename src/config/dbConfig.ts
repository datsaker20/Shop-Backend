import mongoose from "mongoose";
import { logDate } from "~/constants/logDate";
import logger from "~/utils/logger";

const uri = process.env.MONGO_URI ?? "mongodb://localhost:27017/shop";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(uri);
    logger.info(`${logDate} MongoDB Connected: ${conn.connection.host} ${uri}`);
  } catch (error) {
    logger.error(`${logDate} ${error}`);
    process.exit(1);
  }
};
