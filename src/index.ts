import bodyParser from "body-parser";
import express from "express";
import { connectDB } from "./config/dbConfig";
import { logDate } from "./constants/logDate";
import { corsHeader as cors, notFoundHandler } from "./middlewares/validation.middlewares";
import routers from "./routes/index.routes";
import logger from "./utils/logger";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(bodyParser.json({ limit: "50mb" }));
app.use(express.json());
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(cors);
app.use("/api/v1", routers);
connectDB();

app.use(notFoundHandler);
app.listen(PORT, () => {
  logger.info(`${logDate} Server running on port ${PORT}`);
});
