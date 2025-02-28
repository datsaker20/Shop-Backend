import { AxiosError, HttpStatusCode } from "axios";
import { NextFunction, Request, RequestHandler, Response } from "express";
import mongoose from "mongoose";

const cors = { origin: "*" };

export const corsHeader: RequestHandler = (_req: Request, res: Response, next: NextFunction) => {
  res.header("Cross-Origin-Resource-Policy", "cross-origin");
  res.header("Access-Control-Allow-Origin", cors.origin);
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, X-Auth-Token, Content-Type, Accept, Authorization, AuthUser"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, PUT, PATCH, OPTIONS");
  res.header("optionsSuccessStatus", "200");
  next();
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /\S+@\S+\.\S+/;
  return emailRegex.test(email);
};

export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true, stack = "") {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export const errorConverter = (err: Error | AxiosError, req: Request, res: Response, next: NextFunction) => {
  let error: Error | ApiError = err;

  if (!(error instanceof ApiError)) {
    const statusCode =
      "status" in error
        ? (error as AxiosError).response?.status
        : error instanceof mongoose.Error || error instanceof AxiosError
          ? HttpStatusCode.BadRequest
          : HttpStatusCode.InternalServerError;
    if (statusCode) {
      const message = error.message || HttpStatusCode[statusCode];
      error = new ApiError(statusCode, message, false, err.stack ?? "");
    }
  }
  next(error as Error);
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  res.status(HttpStatusCode.NotFound).json({
    statusCode: 404,
    message: `Route ${req.originalUrl} not found`
  });
  next();
};
