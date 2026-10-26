import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../../models/User.js";
import { Order } from "../../models/Order.js";
import { Review } from "../../models/Review.js";
import { Wishlist } from "../../models/Wishlist.js";
import { OtpRequest } from "../../models/OtpRequest.js";
import { sendPasswordResetOtpNotification } from "../../services/notification.service.js";
import { env } from "../../config/env.js";


/**
 * Sign JWT access token for user
 */
export function signToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn,
    }
  );
}

/**
 * Authenticate user with email and password with brute-force lockout and generic error messages
 */
export async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() });

  // Generic invalid credentials error to prevent user enumeration
  const genericAuthError = () => {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    error.code = "INVALID_CREDENTIALS";
    return error;
  };

  if (!user || !user.isActive) {
    throw genericAuthError();
  }

  // Check if account is temporarily locked
  if (user.lockUntil && user.lockUntil > Date.now()) {
    const remainingMinutes = Math.max(1, Math.ceil((user.lockUntil.getTime() - Date.now()) / (60 * 1000)));
    const error = new Error(`Account temporarily locked due to consecutive failed attempts. Please retry in ${remainingMinutes} minute(s).`);
    error.statusCode = 423; // 423 Locked
    error.code = "ACCOUNT_LOCKED";
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    if (user.loginAttempts >= 5) {
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lockout
    }
    await user.save();
    throw genericAuthError();
  }

  // Reset lockout counters on successful password verification
  if (user.loginAttempts > 0 || user.lockUntil) {
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();
  }

  const token = signToken(user);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    },
    token,
  };
}

/**
 * Register a new customer
 */
export async function register({ name, email, password, phone }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    const error = new Error("An account with this email address already exists.");
    error.statusCode = 409;
    error.code = "USER_EXISTS";
    throw error;
  }

  const user = new User({
    name,
    email: email.toLowerCase(),
    password,
    phone,
    role: "customer",
  });

  await user.save();
  const token = signToken(user);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    },
    token,
  };
}

/**
 * Get profile for authenticated user
 */
export async function getProfile(userId) {
  const user = await User.findById(userId).select("-password");
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    error.code = "USER_NOT_FOUND";
    throw error;
  }
  return user;
}

/**
 * Update user profile
 */
export async function updateProfile(userId, { name, phone }) {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    error.code = "USER_NOT_FOUND";
    throw error;
  }

  if (name) user.name = name.trim();
  if (phone !== undefined) user.phone = phone.trim();

  await user.save();
  return getProfile(userId);
}

/**
 * Add shipping address to user
 */
export async function addAddress(userId, addressData) {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (addressData.isDefault || user.addresses.length === 0) {
    user.addresses.forEach((addr) => (addr.isDefault = false));
    addressData.isDefault = true;
  }

  user.addresses.push(addressData);
  await user.save();
  return user.addresses;
}

/**
 * Update an existing shipping address
 */
export async function updateAddress(userId, addressId, addressData) {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const addr = user.addresses.id(addressId);
  if (!addr) {
    const error = new Error("Address not found");
    error.statusCode = 404;
    throw error;
  }

  if (addressData.isDefault) {
    user.addresses.forEach((a) => (a.isDefault = false));
  }

  Object.assign(addr, addressData);
  await user.save();
  return user.addresses;
}

/**
 * Delete a shipping address
 */
export async function deleteAddress(userId, addressId) {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const addr = user.addresses.id(addressId);
  if (!addr) {
    const error = new Error("Address not found");
    error.statusCode = 404;
    throw error;
  }

  const wasDefault = addr.isDefault;
  user.addresses.pull(addressId);

  if (wasDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }

  await user.save();
  return user.addresses;
}

/**
 * Set an address as default
 */
export async function setDefaultAddress(userId, addressId) {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const addr = user.addresses.id(addressId);
  if (!addr) {
    const error = new Error("Address not found");
    error.statusCode = 404;
    throw error;
  }

  user.addresses.forEach((a) => {
    a.isDefault = a._id.toString() === addressId.toString();
  });

  await user.save();
  return user.addresses;
}

/**
 * DPDP Act 2023: Export all personal data belonging to the user
 */
export async function exportUserData(userId) {
  const user = await User.findById(userId).select("-password -__v");
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    error.code = "USER_NOT_FOUND";
    throw error;
  }

  // Fetch orders linked to this customer
  const orders = await Order.find({
    $or: [
      { user: user._id },
      { "customer.email": user.email },
      { "customerDetails.email": user.email },
    ],
  })
    .select("orderNumber status pricing paymentMethod payment.method shippingAddress createdAt")
    .lean();

  // Fetch reviews written by customer
  const reviews = await Review.find({ user: user._id })
    .select("product rating title comment isVerifiedPurchase createdAt")
    .lean();

  // Fetch wishlist
  const wishlist = await Wishlist.findOne({ user: user._id })
    .populate("products", "title name slug price")
    .lean();

  return {
    compliance: {
      framework: "Digital Personal Data Protection Act, 2023 (DPDP Act, India)",
      fiduciary: "House of Laado Atelier",
      exportedAt: new Date().toISOString(),
      rightsIncluded: ["Right to Access", "Right to Portability"],
    },
    profile: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || null,
      role: user.role,
      joinedAt: user.createdAt,
      addresses: user.addresses || [],
    },
    orders: orders.map((o) => ({
      orderNumber: o.orderNumber,
      status: o.status,
      paymentMethod: o.paymentMethod || o.payment?.method,
      totalAmount: o.pricing?.grandTotal || o.pricing?.total,
      shippingCity: o.shippingAddress?.city,
      shippingPincode: o.shippingAddress?.pincode,
      placedAt: o.createdAt,
    })),
    reviews: reviews || [],
    wishlist: wishlist?.products || [],
  };
}

/**
 * DPDP Act 2023: Right to Erasure / Account Deletion
 * Anonymizes PII while retaining financial audit records as required by Indian tax statutes.
 */
export async function eraseUserAccount(userId, password) {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    error.code = "USER_NOT_FOUND";
    throw error;
  }

  // Confirm password before executing irreversible erasure
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error("Incorrect password. Deletion verification failed.");
    error.statusCode = 401;
    error.code = "INVALID_CREDENTIALS";
    throw error;
  }

  // Anonymize profile
  const originalEmail = user.email;
  const anonymizedId = user._id.toString().slice(-6);
  user.name = `Anonymized Customer ${anonymizedId}`;
  user.email = `deleted_${user._id}@privacy.vastraloom.internal`;
  user.phone = "0000000000";
  user.addresses = [];
  user.isActive = false;
  user.deletedAt = new Date();
  await user.save();

  // Scrub wishlist
  await Wishlist.deleteOne({ user: user._id });

  // Anonymize user reviews
  await Review.updateMany(
    { user: user._id },
    { $set: { name: "Anonymized Patron", user: null } }
  );

  return {
    erased: true,
    message: "Personal identifiers and customer account permanently deleted under DPDP Act 2023.",
  };
}

/**
 * Automatically provision or synchronize administrator from environment configuration (.env)
 */
export async function ensureAdminUser() {
  if (!env.adminEmail || !env.adminPassword) return;

  const email = env.adminEmail.toLowerCase();
  let admin = await User.findOne({ email });

  if (!admin) {
    admin = new User({
      name: "Store Administrator",
      email: email,
      password: env.adminPassword,
      role: "admin",
      isActive: true,
      loginAttempts: 0,
      lockUntil: null,
    });
    await admin.save();
    console.log(`[Auth Bootstrap] Initial administrator ensured from .env: ${email}`);
  } else {
    // If account was locked or credentials updated in .env, sync and unlock
    const isSamePassword = await admin.comparePassword(env.adminPassword);
    if (!isSamePassword || admin.lockUntil || !admin.isActive || admin.role !== "admin") {
      admin.password = env.adminPassword;
      admin.role = "admin";
      admin.isActive = true;
      admin.loginAttempts = 0;
      admin.lockUntil = null;
      await admin.save();
      console.log(`[Auth Bootstrap] Administrator credentials synchronized from .env for: ${email}`);
    }
  }
}

/**
 * Send 6-digit OTP for Forgot Password / Account Verification via Email or Phone
 */
export async function sendForgotPasswordOtp({ identifier }) {
  const rawId = String(identifier || "").trim();
  if (!rawId) {
    const error = new Error("Registered email address or phone number is required.");
    error.statusCode = 400;
    error.code = "IDENTIFIER_REQUIRED";
    throw error;
  }

  const isEmail = rawId.includes("@");
  const normalizedEmail = isEmail ? rawId.toLowerCase() : null;
  const cleanedPhone = !isEmail ? rawId.replace(/[^0-9+]/g, "") : null;

  let user = null;
  if (isEmail) {
    user = await User.findOne({ email: normalizedEmail, isActive: true });
  } else {
    const digitsOnly = rawId.replace(/\D/g, "");
    const last10 = digitsOnly.slice(-10);
    user = await User.findOne({
      $or: [
        { phone: rawId },
        { phone: cleanedPhone },
        ...(last10.length >= 7 ? [{ phone: new RegExp(`${last10}$`) }] : []),
      ],
      isActive: true,
    });
  }

  if (!user) {
    const error = new Error(
      `No registered account found with ${isEmail ? "email" : "phone number"}: "${rawId}". Please check for typos or create a new account.`
    );
    error.statusCode = 404;
    error.code = "USER_NOT_FOUND";
    throw error;
  }

  // Generate cryptographic 6-digit numeric OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const salt = await bcrypt.genSalt(10);
  const otpHash = await bcrypt.hash(otp, salt);

  const targetIdentifier = isEmail ? normalizedEmail : (user.phone || cleanedPhone);

  // Invalidate previous unverified OTPs for this identifier
  await OtpRequest.deleteMany({
    identifier: targetIdentifier,
    purpose: "forgot_password",
  });

  // Save new OTP record (10 minutes validity)
  const otpDoc = new OtpRequest({
    identifier: targetIdentifier,
    email: user.email,
    phone: user.phone || cleanedPhone,
    otpHash,
    purpose: "forgot_password",
    attempts: 0,
    isVerified: false,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });
  await otpDoc.save();

  // Dispatch notification
  await sendPasswordResetOtpNotification({
    identifier: targetIdentifier,
    otp,
    user,
    isEmail,
  });

  return {
    identifier: targetIdentifier,
    channel: isEmail ? "email" : "phone",
    maskedRecipient: isEmail
      ? user.email.replace(/(.{2})(.*)(@.*)/, "$1***$3")
      : (user.phone ? user.phone.slice(-4).padStart(user.phone.length, "*") : targetIdentifier),
    message: `A 6-digit verification code has been dispatched to your registered ${isEmail ? "email address" : "mobile number"}.`,
    // In development mode, include devOtp so testing in browser or scripts is instant
    ...(env.nodeEnv !== "production" ? { devOtp: otp } : {}),
  };
}

/**
 * Verify Forgot Password OTP, optionally reset password, and log user in immediately
 */
export async function verifyForgotPasswordOtp({ identifier, otp, newPassword }) {
  const rawId = String(identifier || "").trim();
  const isEmail = rawId.includes("@");
  const normalizedId = isEmail ? rawId.toLowerCase() : rawId.replace(/[^0-9+]/g, "");

  // Find user first to identify exact stored identifier
  let user = null;
  if (isEmail) {
    user = await User.findOne({ email: normalizedId, isActive: true });
  } else {
    const digitsOnly = rawId.replace(/\D/g, "");
    const last10 = digitsOnly.slice(-10);
    user = await User.findOne({
      $or: [
        { phone: rawId },
        { phone: normalizedId },
        ...(last10.length >= 7 ? [{ phone: new RegExp(`${last10}$`) }] : []),
      ],
      isActive: true,
    });
  }

  if (!user) {
    const error = new Error("User account could not be found.");
    error.statusCode = 404;
    error.code = "USER_NOT_FOUND";
    throw error;
  }

  // Find active OTP record for either normalizedId or user's email/phone
  const otpDoc = await OtpRequest.findOne({
    $or: [
      { identifier: normalizedId },
      { identifier: user.email },
      ...(user.phone ? [{ identifier: user.phone }] : []),
    ],
    purpose: "forgot_password",
    isVerified: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!otpDoc) {
    const error = new Error("Invalid or expired OTP. Please request a new verification code.");
    error.statusCode = 400;
    error.code = "OTP_EXPIRED";
    throw error;
  }

  if (otpDoc.attempts >= 5) {
    const error = new Error("Maximum OTP verification attempts reached. Please request a fresh OTP.");
    error.statusCode = 429;
    error.code = "TOO_MANY_ATTEMPTS";
    throw error;
  }

  const isMatch = await bcrypt.compare(String(otp).trim(), otpDoc.otpHash);
  if (!isMatch) {
    otpDoc.attempts += 1;
    await otpDoc.save();
    const remaining = Math.max(0, 5 - otpDoc.attempts);
    const error = new Error(`Incorrect verification code. ${remaining} attempt(s) remaining.`);
    error.statusCode = 400;
    error.code = "INVALID_OTP";
    throw error;
  }

  // Mark OTP verified
  otpDoc.isVerified = true;
  await otpDoc.save();

  // If customer provided a new password, update it!
  if (newPassword && String(newPassword).trim().length >= 6) {
    user.password = String(newPassword).trim();
  }
  user.loginAttempts = 0;
  user.lockUntil = null;
  await user.save();

  // Generate JWT access token so user is logged in directly
  const token = signToken(user);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
    token,
  };
}
