import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";

/**
 * Verify JWT Access Token
 */
export async function authenticate(req, res, next) {
  try {
    let token = null;

    // 1. Check Authorization Bearer header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      // 2. Check HttpOnly cookie
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication token missing. Please log in.",
        },
      });
    }

    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.id).select("-password");

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "User account not found or deactivated.",
        },
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: {
        code: "INVALID_TOKEN",
        message: "Session expired or invalid token. Please log in again.",
      },
    });
  }
}

/**
 * Generalized RBAC Middleware: Verify caller possesses at least one of the specified roles
 * @param  {...string} roles
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required.",
        },
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: `Access denied. Requires one of roles: [${roles.join(", ")}]. Current role: '${req.user.role}'`,
        },
      });
    }

    next();
  };
}

/**
 * Require Staff or higher (staff, admin, owner)
 */
export const requireStaff = requireRole("staff", "admin", "owner");

/**
 * Require Admin or higher (admin, owner)
 */
export const requireAdmin = requireRole("admin", "owner");

/**
 * Require Owner only (highest privilege: billing, owner transfers, critical security)
 */
export const requireOwner = requireRole("owner");

/**
 * Optional Authentication (attaches user if valid token present, otherwise proceeds as guest)
 */
export async function optionalAuthenticate(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.id).select("-password");
    if (user && user.isActive) {
      req.user = user;
    }
  } catch (err) {
    // Invalid/expired token: proceed as guest
  }
  next();
}
