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

  async login(req: Request, res: Response) {
    try {
      const payload = req.body;

      const result = await userService.loginUser(payload);

      return await successResponse(res, {
        statusCode: 200,
        message: "Login successful",
        payload: result.user,
        token: result.token,
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

  async getProfile(req: Request, res: Response) {
    try {
      const user = req.user;

      return await successResponse(res, {
        statusCode: 200,
        message: "Profile retrieved successfully",
        payload: user,
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

  async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const payload = req.body;

      if (!userId) {
        return await errorResponse(res, {
          statusCode: 401,
          message: "User not authenticated",
        });
      }

      const result = await userService.updateUserProfile(userId, payload);

      return await successResponse(res, {
        statusCode: 200,
        message: "Profile updated successfully",
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
