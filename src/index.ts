import { HttpStatusCode } from "axios";
import bodyParser from "body-parser";
import express, { NextFunction, Request, Response } from "express";
import fs from "fs";
import morgan from "morgan";
import path from "path";
import { connectDB } from "./config/dbConfig";
import { logDate } from "./constants/logDate";
import { ApiError, corsHeader as cors, errorHandlerImage } from "./middlewares/validation.middlewares";
import routers from "./routes/index.routes";
import logger from "./utils/logger";

const app = express();
const PORT = process.env.PORT ?? 3000;

// Tạo thư mục uploads nếu chưa có
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(bodyParser.json({ limit: "50mb" }));
app.use(express.json());
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(morgan("dev"));
app.use(cors);
app.use("/static/image", express.static(path.join(__dirname, "../uploads/avatars")));
app.use("/api/v1", routers);

app.use(errorHandlerImage);

app.use((req: Request, res: Response, next: NextFunction) => {
  next(new ApiError(HttpStatusCode.NotFound, "Non-existent API"));
});

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`${logDate} Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
