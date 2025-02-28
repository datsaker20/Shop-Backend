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