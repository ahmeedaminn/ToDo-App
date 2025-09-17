import express from "express";
import dotenv from "dotenv";
import db from "./startup/db.js";
import routes from "./startup/routes.js";
import { logger } from "./startup/logger.js";

export const app = express();
dotenv.config();
db();
routes(app);

const port = process.env.PORT || 3000;
app.listen(port, () => logger.info(`Listening on port ${port}`));
