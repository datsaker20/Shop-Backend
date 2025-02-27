import express, { Router } from "express";

import userController from "../controllers/users.controllers";

export const userRouter: Router = express.Router();
userRouter.post("/register", userController.registerUser);
