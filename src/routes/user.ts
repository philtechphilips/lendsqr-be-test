import { Router, Request, Response } from "express";
import { UserController } from "../modules/users/user.controller";
import { validateCreateUser } from "../validators/user-validator";

const router = Router();
const userController = new UserController();

// User registration routes
router.post("/register", validateCreateUser, (req: Request, res: Response) =>
  userController.register(req, res),
);

// router.post("/login", (req: Request, res: Response) => userController.login(req, res));

// User profile routes (for future implementation)
// router.get("/profile", (req: Request, res: Response) => userController.getProfile(req, res));
// router.put("/profile", (req: Request, res: Response) => userController.updateProfile(req, res));

export default router;
