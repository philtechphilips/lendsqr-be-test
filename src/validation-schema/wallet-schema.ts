import Joi from "joi";

export const fundWalletSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required().messages({
    "number.positive": "Amount must be a positive number",
    "number.precision": "Amount can have maximum 2 decimal places",
    "any.required": "Amount is required",
  }),
  reference: Joi.string().optional().messages({
    "string.base": "Reference must be a string",
  }),
});

export const transferFundsSchema = Joi.object({
  recipientEmail: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Recipient email is required",
  }),
  amount: Joi.number().positive().precision(2).required().messages({
    "number.positive": "Amount must be a positive number",
    "number.precision": "Amount can have maximum 2 decimal places",
    "any.required": "Amount is required",
  }),
  reference: Joi.string().optional().messages({
    "string.base": "Reference must be a string",
  }),
});

export const withdrawFundsSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required().messages({
    "number.positive": "Amount must be a positive number",
    "number.precision": "Amount can have maximum 2 decimal places",
    "any.required": "Amount is required",
  }),
  reference: Joi.string().optional().messages({
    "string.base": "Reference must be a string",
  }),
});
