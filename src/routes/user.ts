import { Router, Request, Response } from "express";
import { UserController } from "../modules/users/user.controller";
import {
  validateCreateUser,
  validateLogin,
  validateUpdateUser,
} from "../validators/user-validator";
import { authMiddleware } from "../middlewares/auth";

const router = Router();
const userController = new UserController();

router.get("/", authMiddleware, (req: Request, res: Response) =>
  userController.getProfile(req, res),
);

router.post("/register", validateCreateUser, (req: Request, res: Response) =>
  userController.register(req, res),
);

router.post("/login", validateLogin, (req: Request, res: Response) =>
  userController.login(req, res),
);

router.patch(
  "/profile",
  authMiddleware,
  validateUpdateUser,
  (req: Request, res: Response) => userController.updateProfile(req, res),
);

export default router;
