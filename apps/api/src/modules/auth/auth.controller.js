import * as authService from "./auth.service.js";
import { env } from "../../config/env.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export async function login(req, res, next) {
  try {
    const { user, token } = await authService.login(req.body);

    // Set HttpOnly cookie
    res.cookie("token", token, COOKIE_OPTIONS);

    res.json({
      success: true,
      message: "Logged in successfully",
      data: {
        user,
        token,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function register(req, res, next) {
  try {
    const { user, token } = await authService.register(req.body);

    res.cookie("token", token, COOKIE_OPTIONS);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        user,
        token,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res) {
  res.clearCookie("token", {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
  });

  res.json({
    success: true,
    message: "Logged out successfully",
  });
}

export async function getMe(req, res, next) {
  try {
    const user = await authService.getProfile(req.user._id);
    res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const user = await authService.updateProfile(req.user._id, req.body);
    res.json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (err) {
    next(err);
  }
}

export async function getAddresses(req, res, next) {
  try {
    const user = await authService.getProfile(req.user._id);
    res.json({
      success: true,
      data: user.addresses || [],
    });
  } catch (err) {
    next(err);
  }
}

export async function addAddress(req, res, next) {
  try {
    const addresses = await authService.addAddress(req.user._id, req.body);
    res.status(201).json({
      success: true,
      message: "Address added successfully",
      data: addresses,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateAddress(req, res, next) {
  try {
    const addresses = await authService.updateAddress(req.user._id, req.params.id, req.body);
    res.json({
      success: true,
      message: "Address updated successfully",
      data: addresses,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteAddress(req, res, next) {
  try {
    const addresses = await authService.deleteAddress(req.user._id, req.params.id);
    res.json({
      success: true,
      message: "Address deleted successfully",
      data: addresses,
    });
  } catch (err) {
    next(err);
  }
}

export async function setDefaultAddress(req, res, next) {
  try {
    const addresses = await authService.setDefaultAddress(req.user._id, req.params.id);
    res.json({
      success: true,
      message: "Default address updated",
      data: addresses,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DPDP Act 2023: Export personal data
 */
export async function exportData(req, res, next) {
  try {
    const data = await authService.exportUserData(req.user._id);
    res.json({
      success: true,
      message: "Personal data exported successfully in accordance with DPDP Act 2023.",
      data,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DPDP Act 2023: Erasure / Account deletion
 */
export async function eraseAccount(req, res, next) {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({
        success: false,
        error: {
          code: "PASSWORD_REQUIRED",
          message: "Please enter your current password to confirm permanent account deletion.",
        },
      });
    }

    const result = await authService.eraseUserAccount(req.user._id, password);

    // Clear session cookies
    res.clearCookie("token", {
      httpOnly: true,
      secure: env.nodeEnv === "production",
      sameSite: "lax",
    });

    res.json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Send OTP for Forgot Password / Account Verification
 */
export async function sendForgotPasswordOtp(req, res, next) {
  try {
    const result = await authService.sendForgotPasswordOtp(req.body);
    res.json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Verify OTP, reset password, and log in customer
 */
export async function verifyForgotPasswordOtp(req, res, next) {
  try {
    const { user, token } = await authService.verifyForgotPasswordOtp(req.body);

    // Set HttpOnly session cookie
    res.cookie("token", token, COOKIE_OPTIONS);

    res.json({
      success: true,
      message: "OTP verified successfully. You are now signed in.",
      data: {
        user,
        token,
      },
    });
  } catch (err) {
    next(err);
  }
}
