import { HttpStatusCode } from "axios";
import { Request, Response } from "express";
import { IUser } from "~/models/db/User";
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
    const { email, password } = req.body;
    const token = await userService.signIn({ email, password });
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

const forgetPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    await userService.forgetPassword(email);

    res.status(HttpStatusCode.Ok).json({
      statusCode: HttpStatusCode.Ok,
      message: "Please check your email to reset password"
    });
  } catch (error: unknown) {
    console.log(error);

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

const resetPassword = async (req: Request, res: Response) => {
  const { token } = req.query;
  const { password } = req.body;
  try {
    await userService.resetPassword(token as string, password);
    res.status(HttpStatusCode.Ok).json({
      statusCode: HttpStatusCode.Ok,
      message: "Reset password successfully"
    });
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

const updateUser = async (req: Request, res: Response) => {
  try {
    const id = req.query.id as string;
    if (req.user) {
      if (req.user.id !== id && !req.user.isAdmin) {
        res.status(HttpStatusCode.Forbidden).json({
          statusCode: HttpStatusCode.Forbidden,
          message: "Permission denied"
        });
        return;
      }
    }
    const { userName, fullName, email, phone, address } = req.body;
    const user: Partial<IUser> = { userName, fullName, email, phone, address };
    const updatedUser = await userService.updateUser(id, user, req.file);
    console.log(updatedUser);

    res.status(HttpStatusCode.Ok).json({
      statusCode: HttpStatusCode.Ok,
      message: "Update user successfully",
      data: updatedUser
    });
    return;
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
    return;
  }
};

export default {
  registerUser,
  loginUser,
  verifyEmail,
  getAllUsers,
  logoutUser,
  forgetPassword,
  resetPassword,
  updateUser
};
