import { IUser } from "~/models/db/User";
import { Role } from "./enum";
export interface IRequestUser {
  id: string;
  email: string;
  userName: string;
  role: Role;
}
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

export interface IPassword {
  password: string;
  confirmPassword: string;
}
