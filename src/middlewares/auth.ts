import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/app";
import { fetchOne } from "../utils/schema";
import { errorResponse } from "../utils/response";
import { UnauthorizedError, NotFoundError } from "../utils/errors";

// Extend Request interface to include user and token
declare global {
  namespace Express {
    interface Request {
      user?: any;
      token?: string;
    }
  }
}

// Define table name constant
const USERS_TABLE = "users";

// handles user authentication
export class Auth {
  async authenticate(req: Request, res: Response, next: NextFunction) {
    try {
      // Get token from Authorization header
      const authHeader = req.header("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new UnauthorizedError("Access token is required");
      }

      const token = authHeader.replace("Bearer ", "");

      // Verify token using consolidated utility
      const decoded = verifyToken(token);

      // Find user in database
      const user = await fetchOne(USERS_TABLE, {
        id: decoded.userId,
      });

      if (!user) {
        throw new NotFoundError("User not found");
      }

      // Remove password from user object
      const { password, ...userWithoutPassword } = user;

      // Attach user and token to request
      req.token = token;
      req.user = userWithoutPassword;

      next();
    } catch (error) {
      if (
        error instanceof UnauthorizedError ||
        error instanceof NotFoundError
      ) {
        return errorResponse(res, {
          statusCode: error.statusCode,
          message: error.message,
        });
      }

      return errorResponse(res, {
        statusCode: 401,
        message: "Authentication required",
      });
    }
  }
}

// Export a middleware function for easier use
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const auth = new Auth();
  return auth.authenticate(req, res, next);
};
