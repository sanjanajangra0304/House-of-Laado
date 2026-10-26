"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { loginAdmin, logoutAdmin, getAdminMe } from "./api";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check initial auth state from localStorage
    const savedUser = localStorage.getItem("admin_user");
    const savedToken = localStorage.getItem("admin_token");

    if (savedUser && savedToken) {
      try {
        const parsed = JSON.parse(savedUser);
        if (["admin", "owner", "staff"].includes(parsed.role)) {
          setAdminUser(parsed);
        } else {
          localStorage.removeItem("admin_user");
          localStorage.removeItem("admin_token");
        }
      } catch (e) {
        localStorage.removeItem("admin_user");
        localStorage.removeItem("admin_token");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    // Authenticate exclusively via real MongoDB Atlas backend API
    const res = await loginAdmin(email, password);
    if (res?.data?.user) {
      if (!["admin", "owner", "staff"].includes(res.data.user.role)) {
        throw new Error("Access denied. Administrative privileges required to enter this portal.");
      }
      setAdminUser(res.data.user);
      localStorage.setItem("admin_user", JSON.stringify(res.data.user));
      localStorage.setItem("admin_token", res.data.token);
      return { success: true };
    }
    throw new Error("Authentication failed. Please verify your email and password.");
  };

  const logout = async () => {
    try {
      await logoutAdmin();
    } catch (e) {
      // Ignore network errors on logout
    }
    setAdminUser(null);
    localStorage.removeItem("admin_user");
    localStorage.removeItem("admin_token");
  };

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        isAuthenticated: !!adminUser,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}
