import Joi from "joi";

export const createUserSchema = Joi.object({
  firstName: Joi.string().required().max(50).messages({
    "any.required": "First name is required.",
    "string.base": "First name must be a string.",
    "string.empty": "First name cannot be empty.",
    "string.max": "First name cannot exceed 50 characters.",
  }),
  lastName: Joi.string().max(50).optional().messages({
    "string.base": "Last name must be a string.",
    "string.max": "Last name cannot exceed 50 characters.",
  }),
  email: Joi.string().email().required().messages({
    "any.required": "Email is required.",
    "string.email": "Please provide a valid email address.",
    "string.empty": "Email cannot be empty.",
  }),
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .allow(null, "")
    .optional()
    .messages({
      "string.pattern.base": "Please provide a valid phone number format.",
    }),
  password: Joi.string()
    .min(8)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .messages({
      "any.required": "Password is required.",
      "string.min": "Password must be at least 8 characters long.",
      "string.pattern.base":
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
      "string.empty": "Password cannot be empty.",
    }),
  dob: Joi.date().iso().max("now").required().messages({
    "any.required": "Date of birth is required.",
    "date.format": "Date of birth must be in ISO format (YYYY-MM-DD).",
    "date.max": "Date of birth cannot be in the future.",
  }),
  bvn: Joi.string().length(11).pattern(/^\d+$/).required().messages({
    "any.required": "BVN is required.",
    "string.length": "BVN must be exactly 11 digits.",
    "string.pattern.base": "BVN must contain only numbers.",
  }),
  addressLine1: Joi.string().max(100).optional().messages({
    "string.base": "Address line 1 must be a string.",
    "string.max": "Address line 1 cannot exceed 100 characters.",
  }),
  addressLine2: Joi.string().max(100).optional().messages({
    "string.base": "Address line 2 must be a string.",
    "string.max": "Address line 2 cannot exceed 100 characters.",
  }),
  city: Joi.string().max(50).optional().messages({
    "string.base": "City must be a string.",
    "string.max": "City cannot exceed 50 characters.",
  }),
  state: Joi.string().max(50).optional().messages({
    "string.base": "State must be a string.",
    "string.max": "State cannot exceed 50 characters.",
  }),
  country: Joi.string().max(50).optional().messages({
    "string.base": "Country must be a string.",
    "string.max": "Country cannot exceed 50 characters.",
  }),
  postalCode: Joi.string().max(20).optional().messages({
    "string.base": "Postal code must be a string.",
    "string.max": "Postal code cannot exceed 20 characters.",
  }),
  nokName: Joi.string().max(100).optional().messages({
    "string.base": "Next of kin name must be a string.",
    "string.max": "Next of kin name cannot exceed 100 characters.",
  }),
  nokPhone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional()
    .messages({
      "string.pattern.base":
        "Next of kin phone must be a valid phone number format.",
    }),
  nokEmail: Joi.string().email().optional().messages({
    "string.email": "Next of kin email must be a valid email address.",
  }),
  nokRelationship: Joi.string().max(50).optional().messages({
    "string.base": "Next of kin relationship must be a string.",
    "string.max": "Next of kin relationship cannot exceed 50 characters.",
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "any.required": "Email is required.",
    "string.email": "Please provide a valid email address.",
    "string.empty": "Email cannot be empty.",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required.",
    "string.empty": "Password cannot be empty.",
  }),
});

export const updateUserSchema = Joi.object({
  firstName: Joi.string().max(50).optional().messages({
    "string.base": "First name must be a string.",
    "string.max": "First name cannot exceed 50 characters.",
  }),
  lastName: Joi.string().max(50).optional().messages({
    "string.base": "Last name must be a string.",
    "string.max": "Last name cannot exceed 50 characters.",
  }),
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .allow(null, "")
    .optional()
    .messages({
      "string.pattern.base": "Please provide a valid phone number format.",
    }),
  addressLine1: Joi.string().max(100).optional().messages({
    "string.base": "Address line 1 must be a string.",
    "string.max": "Address line 1 cannot exceed 100 characters.",
  }),
  addressLine2: Joi.string().max(100).optional().messages({
    "string.base": "Address line 2 must be a string.",
    "string.max": "Address line 2 cannot exceed 100 characters.",
  }),
  city: Joi.string().max(50).optional().messages({
    "string.base": "City must be a string.",
    "string.max": "City cannot exceed 50 characters.",
  }),
  state: Joi.string().max(50).optional().messages({
    "string.base": "State must be a string.",
    "string.max": "State cannot exceed 50 characters.",
  }),
  country: Joi.string().max(50).optional().messages({
    "string.base": "Country must be a string.",
    "string.max": "Country cannot exceed 50 characters.",
  }),
  postalCode: Joi.string().max(20).optional().messages({
    "string.base": "Postal code must be a string.",
    "string.max": "Postal code cannot exceed 20 characters.",
  }),
  nokName: Joi.string().max(100).optional().messages({
    "string.base": "Next of kin name must be a string.",
    "string.max": "Next of kin name cannot exceed 100 characters.",
  }),
  nokPhone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional()
    .messages({
      "string.pattern.base":
        "Next of kin phone must be a valid phone number format.",
    }),
  nokEmail: Joi.string().email().optional().messages({
    "string.email": "Next of kin email must be a valid email address.",
  }),
  nokRelationship: Joi.string().max(50).optional().messages({
    "string.base": "Next of kin relationship must be a string.",
    "string.max": "Next of kin relationship cannot exceed 50 characters.",
  }),
});
