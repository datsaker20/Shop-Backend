import { HttpStatusCode } from "axios";
import dotenv from "dotenv";
import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import jwt from "jsonwebtoken";
import { Role } from "~/constants/enum";
import { IToken } from "~/constants/interface";
import { IUser } from "~/models/db/User";
import redisClient from "~/utils/redis";
dotenv.config();

export const generateToken = (user: IUser): IToken => {
  const secretKey = process.env.JWT_SECRET_KEY;
  console.log(secretKey);

  if (!secretKey) {
    throw new Error("JWT secret key is missing");
  }

  const accessToken = jwt.sign(
    { id: user.id, email: user.email, userName: user.userName, isAdmin: user.role === Role.ADMIN },
    secretKey,
    { expiresIn: "7d" }
  );
  const refreshToken = jwt.sign({ id: user.id }, secretKey, { expiresIn: "30d" });
  const decoded = jwt.decode(accessToken) as jwt.JwtPayload;
  return {
    token: accessToken,
    refreshToken,
    iat: decoded?.iat ?? Math.floor(Date.now() / 1000),
    exp: decoded?.exp ?? Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
  };
};

export const verifyToken = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(HttpStatusCode.Unauthorized).json({
        statusCode: HttpStatusCode.Unauthorized,
        message: "Bearer token is missing"
      });
      return;
    }

    try {
      const token = authHeader.split(" ")[1];
      // Check if token is blacklisted
      const isBlacklisted = await redisClient.get(`blacklist:${token}`);
      if (isBlacklisted) {
        res.status(HttpStatusCode.Unauthorized).json({
          statusCode: HttpStatusCode.Unauthorized,
          message: "Token is blacklisted"
        });
        return;
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as jwt.JwtPayload;
      req.user = decoded as IUser;
      const currentSession = await redisClient.get(`session:${decoded.id}`);
      if (!currentSession || currentSession !== token) {
        res.status(HttpStatusCode.Unauthorized).json({
          statusCode: HttpStatusCode.Unauthorized,
          message: "Session expired or logged in from another device"
        });
        return;
      }

      if (decoded.isAdmin && roles.includes("Admin")) {
        next();
        return;
      }
      if (!decoded.isAdmin && roles.includes("User")) {
        next();
        return;
      }
      res.status(HttpStatusCode.Forbidden).json({
        statusCode: HttpStatusCode.Forbidden,
        message: "Permission denied",
        path: req.originalUrl
      });
    } catch (error) {
      res.status(HttpStatusCode.Forbidden).json({
        statusCode: HttpStatusCode.Forbidden,
        message: `Authentication failed: ${(error as Error).message}`,
        path: req.originalUrl
      });
      return;
    }
  };
};
export const registerValidator = (user: IUser) => {
  const rule = Joi.object({
    userName: Joi.string().required().min(6).max(30),
    fullName: Joi.string().required(),
    email: Joi.string().required().email(),
    password: Joi.string().required().min(6)
  });

  return rule.validate(user);
};
