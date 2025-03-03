import { HttpStatusCode } from "axios";
import { Request, Response } from "express";
import userService from "~/services/users.services";

const registerUser = async (req: Request, res: Response) => {
  try {
    await userService.registerUser(req.body);
    res.status(HttpStatusCode.Created).json({
      statusCode: HttpStatusCode.Created,
      message: "User registered successfully, please check your email to verify"
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
    res.cookie("refreshToken", token.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    });
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

const verifyEmail = async (req: Request, res: Response) => {
  try {
    const token = req.params.token;
    await userService.verifyEmail(token);

    res.status(HttpStatusCode.Ok).json({
      statusCode: HttpStatusCode.Ok,
      message: "Email verified successfully"
    });
  } catch (error: unknown) {
    let statusCode = HttpStatusCode.InternalServerError;
    let message = "Internal Server Error";
    if (error instanceof Error) {
      message = error.message;
      if (message.includes("not found")) {
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

const logoutUser = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      throw new Error("Token is missing");
    }
    const result = await userService.logoutUser(token);
    if (result) {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
      });
      res.status(HttpStatusCode.Ok).json({ statusCode: HttpStatusCode.Ok, message: "Logout successfully" });
    }
  } catch (error) {
    const statusCode = HttpStatusCode.InternalServerError;
    let message = "Internal Server Error";
    if (error instanceof Error) {
      message = error.message;
    }
    res.status(statusCode).json({
      statusCode: statusCode,
      message,
      path: req.originalUrl
    });
  }
};
const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await userService.getAllUsers();
    res.status(HttpStatusCode.Ok).json({
      statusCode: HttpStatusCode.Ok,
      message: "Get all users successfully",
      data: users
    });
  } catch (error: unknown) {
    const statusCode = HttpStatusCode.InternalServerError;
    let message = "Internal Server Error";
    if (error instanceof Error) {
      message = error.message;
    }
    res.status(statusCode).json({
      statusCode,
      message,
      path: req.originalUrl
    });
  }
};

export default { registerUser, loginUser, verifyEmail, getAllUsers, logoutUser };
