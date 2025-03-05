import express, { Router } from "express";

import { verifyToken } from "~/middlewares/auth.middlewares";
import upload from "~/utils/upload";
import userController from "../controllers/users.controllers";

export const userRouter: Router = express.Router();
userRouter.post("/register", userController.registerUser);
userRouter.post("/login", userController.loginUser);
userRouter.post("/logout", userController.logoutUser);
userRouter.post("/forget-password", userController.forgetPassword);
userRouter.post("/reset-password", userController.resetPassword);
userRouter.get("/", verifyToken(["Admin"]), userController.getAllUsers);
userRouter.get("/verify-email/:token", userController.verifyEmail);
userRouter.get("/me", verifyToken(["Admin", "User"]), userController.getUserByEmail);
userRouter.put("", verifyToken(["Admin", "User"]), upload.single("avatar"), userController.updateUser);
userRouter.delete("", verifyToken(["Admin"]), userController.deleteUser);
