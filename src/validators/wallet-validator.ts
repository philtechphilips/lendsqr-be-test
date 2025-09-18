import { Request, Response, NextFunction } from "express";
import {
  fundWalletSchema,
  transferFundsSchema,
  withdrawFundsSchema,
} from "../validation-schema/wallet-schema";
import { errorResponse } from "../utils/response";

export const validateFundWallet = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { error } = fundWalletSchema.validate(req.body);

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

export const validateTransferFunds = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { error } = transferFundsSchema.validate(req.body);

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

export const validateWithdrawFunds = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { error } = withdrawFundsSchema.validate(req.body);

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
