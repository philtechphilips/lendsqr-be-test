import { Response } from "express";

const errorResponse = async (res: Response, data: any) => {
  let { statusCode, message } = data;
  return res
    .status(statusCode)
    .send({ status: "failure", statusCode, message, payload: null });
};

const successResponse = async (res: Response, data: any) => {
  let { payload, statusCode, message, token } = data;
  if (token === undefined) token = null;
  return res
    .status(statusCode)
    .send({ payload, statusCode, message, status: "success", token });
};

export { errorResponse, successResponse };
