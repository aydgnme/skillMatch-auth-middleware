// express middleware to check apiKey
import express from "express";
import { responseSender } from "@utils";
import { ApiKey } from "@models";

async function authApiKey(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey) {
    return responseSender.sendErrorResponse(res, 401, "Invalid API key");
  }
  const key: any = await ApiKey.findOne({ key: apiKey });
  if (!key)
    return responseSender.sendErrorResponse(res, 401, "Invalid API key");

  if (!key.isActive)
    return responseSender.sendErrorResponse(res, 401, "Inactive API key");

  next();
}

export default authApiKey;
