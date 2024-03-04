import app from "@app";
import dotenv from "dotenv";
dotenv.config();
import { logger } from "@utils";
import Database from "./database/database.connection";

const port: number = 8080;

async function onServerBoot() {
  const functionName: string = "onServerBoot";
  try {
    logger.logMessage(functionName, "Server is booted on port " + port);
    await Database.startConnection();
  } catch (e: any) {
    logger.logError(functionName, e);
  }
}

function main() {
  const functionName: string = "main";
  try {
    app.listen(port, onServerBoot);
  } catch (e: any) {
    logger.logError(functionName, e);
  }
}

main();
// Path: src/app/index.ts