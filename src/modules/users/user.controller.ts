import { Request, Response } from "express";
import { UserService } from "./user.service";
import { AppError } from "../../utils/errors";
import { errorResponse, successResponse } from "../../utils/response";

const userService = new UserService();

export class UserController {
  async register(req: Request, res: Response) {
    try {
      const payload = req.body;

      const result = await userService.registerUser(payload);

      return await successResponse(res, {
        statusCode: 201,
        message: "User created successfully",
        payload: result,
      });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        return await errorResponse(res, {
          statusCode: err.statusCode,
          message: err.message,
        });
      }

      return await errorResponse(res, {
        statusCode: 500,
        message: "Internal server error",
      });
    }
  }
}
