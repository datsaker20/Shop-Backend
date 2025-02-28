import { HttpStatusCode } from "axios";
import { Request, Response } from "express";
import userService from "~/services/users.services";

const registerUser = async (req: Request, res: Response) => {
  try {
    const user = req.body;
    const newUser = await userService.registerUser(user);
    res.status(HttpStatusCode.Created).json({
      statusCode: HttpStatusCode.Created,
      message: "User registered successfully",
      data: newUser
    });
  } catch (error: unknown) {
    let statusCode = HttpStatusCode.InternalServerError;
    let message = "Internal Server Error";
    if (error instanceof Error) {
      message = error.message;
      if (message.includes("already exists")) {
        statusCode = HttpStatusCode.BadRequest;
      }
    }
    res.status(statusCode).json({
      statusCode: statusCode,
      message,
      path: req.originalUrl
    });
  }
};

const loginUser = async (req: Request, res: Response) => {
  try {
    const user = req.body;
    const token = await userService.signIn(user);
    res.status(HttpStatusCode.Ok).json({
      statusCode: HttpStatusCode.Ok,
      message: "Login successfully",
      data: token
    });
  } catch (error: unknown) {
    let statusCode = HttpStatusCode.InternalServerError;
    let message = "Internal Server Error";
    if (error instanceof Error) {
      message = error.message;
      if (message.includes("not found") || message.includes("incorrect")) {
        statusCode = HttpStatusCode.BadRequest;
      }
    }
    res.status(statusCode).json({
      statusCode: statusCode,
      message,
      path: req.originalUrl
    });
  }
};
export default { registerUser, loginUser };
