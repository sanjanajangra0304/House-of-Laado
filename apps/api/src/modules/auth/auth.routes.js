import { Router } from "express";
import * as authController from "./auth.controller.js";
import { validate } from "../../middleware/validate.js";
import {
  loginSchema,
  registerSchema,
  sendForgotPasswordOtpSchema,
  verifyForgotPasswordOtpSchema,
} from "./auth.validation.js";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

router.post("/login", validate(loginSchema), authController.login);
router.post("/register", validate(registerSchema), authController.register);
router.post("/logout", authController.logout);

// Forgot Password / OTP Login Routes
router.post(
  "/forgot-password/send-otp",
  validate(sendForgotPasswordOtpSchema),
  authController.sendForgotPasswordOtp
);
router.post(
  "/forgot-password/verify-otp",
  validate(verifyForgotPasswordOtpSchema),
  authController.verifyForgotPasswordOtp
);
router.post(
  "/send-otp",
  validate(sendForgotPasswordOtpSchema),
  authController.sendForgotPasswordOtp
);
router.post(
  "/verify-otp",
  validate(verifyForgotPasswordOtpSchema),
  authController.verifyForgotPasswordOtp
);

router.get("/me", authenticate, authController.getMe);
router.get("/me/export", authenticate, authController.exportData);
router.delete("/me", authenticate, authController.eraseAccount);
router.put("/profile", authenticate, authController.updateProfile);

// Customer saved addresses
router.get("/addresses", authenticate, authController.getAddresses);
router.post("/addresses", authenticate, authController.addAddress);
router.put("/addresses/:id", authenticate, authController.updateAddress);
router.delete("/addresses/:id", authenticate, authController.deleteAddress);
router.patch("/addresses/:id/default", authenticate, authController.setDefaultAddress);

export default router;
