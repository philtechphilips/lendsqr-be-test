import { Request, Response } from "express";
import { WalletService } from "./wallet.service";
import { AppError } from "../../utils/errors";
import { errorResponse, successResponse } from "../../utils/response";

const walletService = new WalletService();

export class WalletController {
  /**
   * Get user's wallet balance
   */
  async getBalance(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const result = await walletService.getWalletBalance(userId);

      return await successResponse(res, {
        statusCode: 200,
        message: "Wallet balance retrieved successfully",
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

  /**
   * Fund user's wallet
   */
  async fundWallet(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const payload = req.body;

      if (!userId) {
        return await errorResponse(res, {
          statusCode: 401,
          message: "User not authenticated",
        });
      }

      // Extract IP address and user agent from request headers
      const ipAddress =
        req.ip ||
        req.connection.remoteAddress ||
        (req.headers["x-forwarded-for"] as string);
      const userAgent = req.headers["user-agent"] as string;

      const result = await walletService.fundWallet(
        userId,
        payload,
        ipAddress,
        userAgent,
      );

      return await successResponse(res, {
        statusCode: 200,
        message: "Wallet funded successfully",
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

  /**
   * Transfer funds to another user
   */
  async transferFunds(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const payload = req.body;

      if (!userId) {
        return await errorResponse(res, {
          statusCode: 401,
          message: "User not authenticated",
        });
      }

      // Extract IP address and user agent from request headers
      const ipAddress =
        req.ip ||
        req.connection.remoteAddress ||
        (req.headers["x-forwarded-for"] as string);
      const userAgent = req.headers["user-agent"] as string;

      const result = await walletService.transferFunds(
        userId,
        payload,
        ipAddress,
        userAgent,
      );

      return await successResponse(res, {
        statusCode: 200,
        message: "Funds transferred successfully",
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

  /**
   * Withdraw funds from user's wallet
   */
  async withdrawFunds(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const payload = req.body;

      if (!userId) {
        return await errorResponse(res, {
          statusCode: 401,
          message: "User not authenticated",
        });
      }

      // Extract IP address and user agent from request headers
      const ipAddress =
        req.ip ||
        req.connection.remoteAddress ||
        (req.headers["x-forwarded-for"] as string);
      const userAgent = req.headers["user-agent"] as string;

      const result = await walletService.withdrawFunds(
        userId,
        payload,
        ipAddress,
        userAgent,
      );

      return await successResponse(res, {
        statusCode: 200,
        message: "Funds withdrawn successfully",
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
