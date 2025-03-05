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
    return;
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
    return;
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
    return;
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
    return;
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
    return;
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
    return;
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
    return;
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
    return;
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
    return;
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
    return;
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
    return;
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
    return;
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

const updateUser = async (req: Request, res: Response) => {
  try {
    const id = req.query.id as string;
    if (req.user) {
      if (req.user.id !== id && !req.user.isAdmin) {
        res.status(HttpStatusCode.Forbidden).json({
          statusCode: HttpStatusCode.Forbidden,
          message: "You don't have permission to update this user"
        });
        return;
      }
    }
    const { userName, fullName, email, phone, address, password, newPassword, confirmPassword } = req.body;
    const user: Partial<IUser> = { userName, fullName, email, phone, address };
    const updatedUser: IUser =
      newPassword && confirmPassword && password
        ? await userService.updateUser(id, user, req.file, { password, newPassword, confirmPassword })
        : await userService.updateUser(id, user, req.file);
    res.status(HttpStatusCode.Ok).json({
      statusCode: HttpStatusCode.Ok,
      message: "Update user successfully",
      data: updatedUser
    });
    return;
  } catch (error: unknown) {
    let statusCode = HttpStatusCode.InternalServerError;
    let message = "Internal Server Error";
    if (error instanceof Error) {
      message = error.message;
      if (message.includes("not found") || message.includes("password")) {
        statusCode = HttpStatusCode.BadRequest;
      }
    }
    res.status(statusCode).json({
      statusCode,
      message,
      path: req.originalUrl
    });
    return;
  }
};

const getUserByEmail = async (req: Request, res: Response) => {
  const email = req.user?.email as string;
  const emailQuery = req.query?.email;
  try {
    if (!email) {
      res.status(HttpStatusCode.Unauthorized).json({
        statusCode: HttpStatusCode.Unauthorized,
        message: "Unauthorized"
      });
      return;
    }
    if (email !== emailQuery && !req.user?.isAdmin) {
      res.status(HttpStatusCode.Forbidden).json({
        statusCode: HttpStatusCode.Forbidden,
        message: "You don't have permission to access this resource"
      });
      return;
    }
    const user = await userService.getUserByEmail(emailQuery as string);
    res.status(HttpStatusCode.Ok).json({
      statusCode: HttpStatusCode.Ok,
      message: "Get user by email successfully",
      data: user
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

const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = req.query.id as string;
    await userService.deleteUser(id);
    res.status(HttpStatusCode.Ok).json({
      statusCode: HttpStatusCode.Ok,
      message: "Delete user successfully"
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
  updateUser,
  getUserByEmail,
  deleteUser
};
