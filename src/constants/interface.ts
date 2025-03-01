import { IUser } from "~/models/db/User";

export interface IToken {
  token: string;
  refreshToken: string;
  iat: number;
  exp: number;
}

export interface IUserLogin {
  email: string;
  password: string;
}
export interface ErrnoException extends Error {
  errno?: number;
  code?: string;
  path?: string;
  syscall?: string;
  stack?: string;
}
declare module "express-serve-static-core" {
  interface Request {
    user?: IUser;
  }
}
export interface IResponseOject {
  statusCode: number;
  message: string;
  path?: string;
}
