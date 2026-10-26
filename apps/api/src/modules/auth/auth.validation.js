import Joi from "joi";

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters",
    "any.required": "Password is required",
  }),
});

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().trim().pattern(/^[0-9+ -]{10,15}$/).optional(),
});

export const sendForgotPasswordOtpSchema = Joi.object({
  identifier: Joi.string().trim().min(3).max(100).required().messages({
    "string.empty": "Email or phone number cannot be empty",
    "any.required": "Email or phone number is required",
  }),
});

export const verifyForgotPasswordOtpSchema = Joi.object({
  identifier: Joi.string().trim().min(3).max(100).required().messages({
    "string.empty": "Email or phone number cannot be empty",
    "any.required": "Email or phone number is required",
  }),
  otp: Joi.string().trim().length(6).pattern(/^[0-9]{6}$/).required().messages({
    "string.length": "OTP must be exactly 6 digits",
    "string.pattern.base": "OTP must be numeric digits",
    "any.required": "6-digit OTP is required",
  }),
  newPassword: Joi.string().min(6).optional().allow("").messages({
    "string.min": "New password must be at least 6 characters long",
  }),
});
