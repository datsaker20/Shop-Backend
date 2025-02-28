import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Role } from "~/constants/enum";
import { IToken } from "~/constants/interface";
import { IUser } from "~/models/db/User";
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
    { expiresIn: "7d"}
  );
  const refreshToken = jwt.sign({ id: user.id }, secretKey, { expiresIn: "30d" });

  const decoded = jwt.decode(accessToken) as jwt.JwtPayload;
  console.log(decoded);

  return {
    token: accessToken,
    refreshToken,
    iat: decoded?.iat ?? Math.floor(Date.now() / 1000),
    exp: decoded?.exp ?? Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
  };
};
