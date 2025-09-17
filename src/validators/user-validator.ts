import { Request, Response, NextFunction } from "express";
import { createUserSchema } from "../validation-schema/user-schema";
import { errorResponse } from "../utils/response";

export const validateCreateUser = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { error } = createUserSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return errorResponse(res, {
      statusCode: 400,
      status: "failure",
      message: errorMessage,
      payload: null,
    });
  }

  next();
};
