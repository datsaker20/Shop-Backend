import express, { Router } from "express";
import { userRouter } from "./users.routes";

const routers: Router = express.Router();

const defaultRoutes = [
  {
    path: "/users",
    router: userRouter
  }
];

defaultRoutes.forEach((route) => {
  routers.use(route.path, route.router);
});

export default routers;
