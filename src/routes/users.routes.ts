import express, { Router } from "express";

import { verifyToken } from "~/middlewares/auth.middlewares";
import userController from "../controllers/users.controllers";

export const userRouter: Router = express.Router();
userRouter.post("/register", userController.registerUser);
userRouter.post("/login", userController.loginUser);
userRouter.post("/logout", userController.logoutUser);
userRouter.get("/", verifyToken(["Admin"]), userController.getAllUsers);
userRouter.get("/verify-email/:token", userController.verifyEmail);
