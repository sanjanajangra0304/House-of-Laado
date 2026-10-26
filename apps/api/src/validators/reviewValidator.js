import Joi from "joi";

export const createReviewSchema = Joi.object({
  product: Joi.string().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  title: Joi.string().trim().max(120).allow("").optional(),
  comment: Joi.string().trim().min(5).max(1000).required(),
  name: Joi.string().trim().min(2).max(100).optional(),
  city: Joi.string().trim().max(100).allow("").optional(),
});

export const updateReviewStatusSchema = Joi.object({
  status: Joi.string().valid("pending", "approved", "hidden").required(),
});

export const updateReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).optional(),
  title: Joi.string().trim().max(120).allow("").optional(),
  comment: Joi.string().trim().min(5).max(1000).optional(),
  city: Joi.string().trim().max(100).allow("").optional(),
}).min(1);

export const adminReplySchema = Joi.object({
  adminReply: Joi.string().trim().min(2).max(1000).required(),
});
