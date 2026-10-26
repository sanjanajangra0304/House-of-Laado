"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { useCart } from "@/lib/cart-context";
import { addSavedAddressApi, fetchCustomerOrdersApi, fetchCustomerReturnsApi } from "@/lib/api";
import { saveCustomerSession, clearCustomerSession } from "@/lib/auth-helpers";
import { CancelOrderModal } from "@/components/order/CancelOrderModal";
import { ReturnRequestModal } from "@/components/order/ReturnRequestModal";
import { RefundTrackingModal } from "@/components/order/RefundTrackingModal";
import { CustomerOrderDetailsModal } from "@/components/order/CustomerOrderDetailsModal";
import {
  User,
  Package,
  MapPin,
  Heart,
  LogOut,
  Mail,
  Lock,
  Phone,
  CheckCircle2,
  AlertCircle,
  Truck,
  Calendar,
  ExternalLink,
  Plus,
  KeyRound,
  ArrowLeft,
  ShoppingBag,
  Sparkles,
  RotateCcw,
  Eye,
  XCircle,
  Clock,
  IndianRupee,
} from "lucide-react";

function AccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/shop";
  const modeParam = searchParams.get("mode") || "login";

  const { wishlist } = useCart();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Auth form state (When unauthenticated)
  const [authMode, setAuthMode] = useState(
    modeParam === "register"
      ? "register"
      : modeParam === "forgot-password"
      ? "forgot-password"
      : "login"
  );
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Forgot password OTP flow state
  const [forgotStep, setForgotStep] = useState(1); // 1 = identifier, 2 = OTP + optional new password
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [otpSentInfo, setOtpSentInfo] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState("");

  // Authenticated Dashboard state
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Order action modal states
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState(null);
  const [selectedOrderForCancel, setSelectedOrderForCancel] = useState(null);
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState(null);
  const [selectedRefundTracking, setSelectedRefundTracking] = useState(null);

  // Address modal/form state
  const [newAddress, setNewAddress] = useState({
    fullName: "",
    phone: "",
    streetAddress: "",
    city: "",
    state: "Rajasthan",
    pincode: "",
  });
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Load customer session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("customer_token");
    const savedUser = localStorage.getItem("customer_user");

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        fetchCustomerOrders(savedToken);
      } catch (e) {
        localStorage.removeItem("customer_token");
        localStorage.removeItem("customer_user");
      }
    }
    setIsLoading(false);
  }, []);

  const fetchCustomerOrders = async (jwt) => {
    setIsLoadingOrders(true);
    try {
      const activeJwt = jwt || token;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

      const [ordersRes, returnsRes] = await Promise.allSettled([
        fetch(`${apiUrl}/orders/my/orders`, {
          headers: { Authorization: `Bearer ${activeJwt}` },
        }),
        fetch(`${apiUrl}/orders/my/returns`, {
          headers: { Authorization: `Bearer ${activeJwt}` },
        }),
      ]);

      if (ordersRes.status === "fulfilled" && ordersRes.value.ok) {
        const json = await ordersRes.value.json();
        setOrders(json.data || []);
      }

      if (returnsRes.status === "fulfilled" && returnsRes.value.ok) {
        const json = await returnsRes.value.json();
        setReturns(json.data || []);
      }
    } catch (e) {
      // Keep state intact on connection hiccup
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    setForgotSuccessMsg("");
    setIsSubmittingAuth(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setToken(json.data.token);
        setUser(json.data.user);
        saveCustomerSession(json.data.token, json.data.user);
        fetchCustomerOrders(json.data.token);
        if (redirectUrl && redirectUrl !== "/account") {
          router.push(redirectUrl);
        }
      } else {
        setAuthError(json.error?.message || json.message || "Invalid email or password.");
      }
    } catch (err) {
      setAuthError("Failed to connect to authentication server. Please try again.");
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError("");
    setForgotSuccessMsg("");
    setIsSubmittingAuth(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      const res = await fetch(`${apiUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerForm),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setToken(json.data.token);
        setUser(json.data.user);
        saveCustomerSession(json.data.token, json.data.user);
        fetchCustomerOrders(json.data.token);
        if (redirectUrl && redirectUrl !== "/account") {
          router.push(redirectUrl);
        }
      } else {
        setAuthError(json.error?.message || json.message || "Registration failed.");
      }
    } catch (err) {
      setAuthError("Failed to create customer account. Please try again.");
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleSendForgotOtp = async (e) => {
    if (e) e.preventDefault();
    setAuthError("");
    setForgotSuccessMsg("");
    if (!forgotIdentifier.trim()) {
      setAuthError("Please enter your registered email address or phone number.");
      return;
    }

    setIsSubmittingForgot(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      const res = await fetch(`${apiUrl}/auth/forgot-password/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: forgotIdentifier.trim() }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setOtpSentInfo(json.data);
        setForgotStep(2);
        setCountdown(30);
        setForgotSuccessMsg(json.message || "Verification code dispatched successfully.");
      } else {
        setAuthError(json.error?.message || json.message || "Account not found. Please verify your email or phone.");
      }
    } catch (err) {
      setAuthError("Network connection error. Could not dispatch OTP.");
    } finally {
      setIsSubmittingForgot(false);
    }
  };

  const handleVerifyForgotOtp = async (e) => {
    if (e) e.preventDefault();
    setAuthError("");
    setForgotSuccessMsg("");
    if (!forgotOtp.trim() || forgotOtp.trim().length !== 6) {
      setAuthError("Please enter the complete 6-digit numeric OTP code.");
      return;
    }

    setIsSubmittingForgot(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      const res = await fetch(`${apiUrl}/auth/forgot-password/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: forgotIdentifier.trim(),
          otp: forgotOtp.trim(),
          newPassword: forgotNewPassword.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setToken(json.data.token);
        setUser(json.data.user);
        saveCustomerSession(json.data.token, json.data.user);
        fetchCustomerOrders(json.data.token);
        setForgotSuccessMsg("✓ Verification successful! Signed in. Continuing your shopping...");
        setTimeout(() => {
          router.push(redirectUrl || "/shop");
        }, 600);
      } else {
        setAuthError(json.error?.message || json.message || "Incorrect or expired OTP code.");
      }
    } catch (err) {
      setAuthError("Network error during verification. Please try again.");
    } finally {
      setIsSubmittingForgot(false);
    }
  };

  const handleLogout = () => {
    clearCustomerSession();
    setToken(null);
    setUser(null);
    setOrders([]);
    setReturns([]);
  };

  const handleOpenCancelModal = (order) => {
    setSelectedOrderForCancel(order);
  };

  const handleOpenReturnModal = (order) => {
    setSelectedOrderForReturn(order);
  };

  const handleOpenDetailsModal = (order) => {
    setSelectedOrderForDetails(order);
  };

  const handleOpenRefundTrackingModal = (order, returnReq = null) => {
    setSelectedRefundTracking({ order, returnRequest: returnReq });
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!newAddress.fullName || !newAddress.streetAddress || !newAddress.pincode) return;
    try {
      const res = await addSavedAddressApi(newAddress);
      if (res.success && res.data) {
        const updatedUser = { ...user, addresses: res.data };
        setUser(updatedUser);
        saveCustomerSession(token, updatedUser);
      }
    } catch {
      const updatedAddresses = [...(user.addresses || []), newAddress];
      const updatedUser = { ...user, addresses: updatedAddresses };
      setUser(updatedUser);
      saveCustomerSession(token, updatedUser);
    }
    setShowAddressForm(false);
    setNewAddress({
      fullName: "",
      phone: "",
      streetAddress: "",
      city: "",
      state: "Rajasthan",
      pincode: "",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ivory-light flex items-center justify-center p-12">
        <div className="w-8 h-8 rounded-full border-2 border-rose border-t-transparent animate-spin" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW A: Unauthenticated Customer (Login / Register / Forgot Password OTP)
  // ---------------------------------------------------------------------------
  if (!token || !user) {
    const isShoppingRedirect = Boolean(redirectUrl && redirectUrl !== "/account");

    return (
      <div className="bg-ivory-light min-h-screen">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Breadcrumbs items={[{ label: "Customer Sign In" }]} />

          <div className="max-w-md mx-auto my-6 sm:my-10">
            {/* Contextual Notice when user clicked 'Shop Now' or 'Buy It Now' */}
            {isShoppingRedirect && (
              <div className="mb-6 p-4 rounded-xl bg-[#FAF7F2] border border-[#C6A75E]/50 text-[#1F2A44] flex items-start space-x-3 shadow-xs">
                <Sparkles className="w-5 h-5 text-[#C6A75E] flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-serif font-bold text-sm text-[#1F2A44]">
                    {redirectUrl.includes("checkout") ? "Complete Your Instant Checkout" : "Welcome to House of Laado"}
                  </p>
                  <p className="text-[#1F2A44]/80 mt-0.5 leading-relaxed">
                    {redirectUrl.includes("checkout")
                      ? "Please sign in or create an account to finalize your order with free delivery & secure payment."
                      : "Please sign in or create an account to start shopping our handcrafted artisanal collections."}
                  </p>
                </div>
              </div>
            )}

            <div className="text-center mb-6">
              <h1 className="font-serif text-3xl font-bold text-burgundy mb-2">
                Customer Atelier Portal
              </h1>
              <p className="text-xs sm:text-sm text-burgundy/85">
                Sign in to explore handcrafted ensembles, track dispatches, and manage your wardrobe.
              </p>
            </div>

            <div className="bg-blush-light border border-blush rounded-2xl p-6 sm:p-8 shadow-sm">
              {/* Error & Success Messages */}
              {authError && (
                <div className="flex items-center space-x-2 text-xs p-3 rounded-lg bg-rose/10 text-rose border border-rose/30 mb-5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {forgotSuccessMsg && (
                <div className="flex items-center space-x-2 text-xs p-3 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 mb-5">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                  <span>{forgotSuccessMsg}</span>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* FLOW 1: FORGOT PASSWORD & OTP SCREEN */}
              {/* ------------------------------------------------------------- */}
              {authMode === "forgot-password" ? (
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setAuthError("");
                      setForgotSuccessMsg("");
                      setForgotStep(1);
                    }}
                    className="inline-flex items-center text-xs text-[#C6A75E] hover:text-[#1F2A44] mb-4 font-semibold transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                    Back to Sign In
                  </button>

                  <div className="text-center mb-6">
                    <div className="w-12 h-12 mx-auto rounded-full bg-[#1F2A44]/10 text-[#1F2A44] flex items-center justify-center mb-2">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <h2 className="font-serif text-xl font-bold text-[#1F2A44]">
                      {forgotStep === 1 ? "Forgot Password" : "Enter Verification OTP"}
                    </h2>
                    <p className="text-xs text-[#1F2A44]/80 mt-1 max-w-xs mx-auto leading-relaxed">
                      {forgotStep === 1
                        ? "Enter your registered email address or mobile number to receive a secure 6-digit OTP."
                        : `A 6-digit verification code has been dispatched to ${
                            otpSentInfo?.maskedRecipient || forgotIdentifier
                          }.`}
                    </p>
                  </div>

                  {forgotStep === 1 ? (
                    <form onSubmit={handleSendForgotOtp} className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-[#1F2A44] block mb-1">
                          Registered Email or Phone Number
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            placeholder="e.g. priya@example.com or 9876543210"
                            value={forgotIdentifier}
                            onChange={(e) => setForgotIdentifier(e.target.value)}
                            className="w-full h-11 pl-10 pr-4 rounded-pill border border-[#E8DCC8] text-xs focus:outline-none focus:border-[#C6A75E] focus:ring-1 focus:ring-[#C6A75E] bg-[#FAF7F2] text-[#1F2A44]"
                          />
                          <Mail className="w-4 h-4 text-[#1F2A44]/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingForgot}
                        className="btn-primary w-full py-3.5 text-xs font-semibold disabled:opacity-50 mt-2 shadow"
                      >
                        {isSubmittingForgot ? "Sending 6-Digit OTP..." : "Send Verification Code (OTP)"}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyForgotOtp} className="space-y-4">
                      {/* Interactive Dev Auto-fill Chip */}
                      {otpSentInfo?.devOtp && (
                        <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                          <span>
                            Dev OTP:{" "}
                            <strong className="font-mono text-sm tracking-wider font-bold">
                              {otpSentInfo.devOtp}
                            </strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => setForgotOtp(otpSentInfo.devOtp)}
                            className="text-[11px] underline font-semibold text-amber-900 hover:text-black ml-2"
                          >
                            Auto-fill OTP
                          </button>
                        </div>
                      )}

                      <div>
                        <label className="text-xs font-bold text-[#1F2A44] block mb-1">
                          Enter 6-Digit Numeric OTP
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            maxLength={6}
                            placeholder="123456"
                            value={forgotOtp}
                            onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            className="w-full h-12 px-4 rounded-pill border border-[#E8DCC8] text-lg font-mono font-bold tracking-[0.35em] text-center focus:outline-none focus:border-[#C6A75E] focus:ring-1 focus:ring-[#C6A75E] bg-[#FAF7F2] text-[#1F2A44]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[#1F2A44] block mb-1">
                          Set New Password{" "}
                          <span className="font-normal text-[#1F2A44]/60">(optional, min 6 characters)</span>
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            minLength={6}
                            placeholder="•••••••• (leave blank to keep current password)"
                            value={forgotNewPassword}
                            onChange={(e) => setForgotNewPassword(e.target.value)}
                            className="w-full h-11 pl-10 pr-4 rounded-pill border border-[#E8DCC8] text-xs focus:outline-none focus:border-[#C6A75E] focus:ring-1 focus:ring-[#C6A75E] bg-[#FAF7F2] text-[#1F2A44]"
                          />
                          <Lock className="w-4 h-4 text-[#1F2A44]/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingForgot || forgotOtp.length !== 6}
                        className="btn-primary w-full py-3.5 text-xs font-semibold disabled:opacity-50 mt-2 shadow"
                      >
                        {isSubmittingForgot
                          ? "Verifying & Signing In..."
                          : redirectUrl.includes("checkout")
                          ? "Verify OTP & Proceed to Checkout →"
                          : "Verify OTP & Continue Shopping →"}
                      </button>

                      <div className="flex items-center justify-between pt-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setForgotStep(1)}
                          className="text-[#1F2A44]/70 hover:text-[#1F2A44] underline"
                        >
                          Change Identifier
                        </button>

                        {countdown > 0 ? (
                          <span className="text-[#1F2A44]/60 font-mono">Resend in {countdown}s</span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSendForgotOtp}
                            disabled={isSubmittingForgot}
                            className="text-[#C6A75E] font-semibold hover:underline"
                          >
                            Resend OTP
                          </button>
                        )}
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                /* ------------------------------------------------------------- */
                /* FLOW 2 & 3: SIGN IN / CREATE ACCOUNT TABS */
                /* ------------------------------------------------------------- */
                <>
                  {/* Tab Selector */}
                  <div className="flex rounded-pill bg-ivory-light border border-blush p-1 mb-6">
                    <button
                      onClick={() => {
                        setAuthMode("login");
                        setAuthError("");
                      }}
                      className={`flex-1 py-2 text-xs font-semibold rounded-pill transition-all ${
                        authMode === "login"
                          ? "bg-burgundy text-ivory-light shadow-sm"
                          : "text-burgundy/80 hover:text-burgundy"
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        setAuthMode("register");
                        setAuthError("");
                      }}
                      className={`flex-1 py-2 text-xs font-semibold rounded-pill transition-all ${
                        authMode === "register"
                          ? "bg-burgundy text-ivory-light shadow-sm"
                          : "text-burgundy/80 hover:text-burgundy"
                      }`}
                    >
                      Create Account
                    </button>
                  </div>

                  {/* Sign In Tab Form */}
                  {authMode === "login" ? (
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-burgundy block mb-1">
                          Email Address
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            required
                            placeholder="you@example.com"
                            value={loginForm.email}
                            onChange={(e) =>
                              setLoginForm({ ...loginForm, email: e.target.value })
                            }
                            className="w-full h-11 pl-10 pr-4 rounded-pill border border-blush text-xs focus:outline-none focus:border-rose focus:ring-1 focus:ring-rose bg-ivory-light text-burgundy"
                          />
                          <Mail className="w-4 h-4 text-burgundy/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-bold text-burgundy block">
                            Password
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setAuthMode("forgot-password");
                              setAuthError("");
                              setForgotSuccessMsg("");
                              setForgotStep(1);
                              if (loginForm.email) {
                                setForgotIdentifier(loginForm.email);
                              }
                            }}
                            className="text-[11px] text-[#C6A75E] hover:text-burgundy hover:underline font-semibold"
                          >
                            Forgot Password?
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={loginForm.password}
                            onChange={(e) =>
                              setLoginForm({ ...loginForm, password: e.target.value })
                            }
                            className="w-full h-11 pl-10 pr-4 rounded-pill border border-blush text-xs focus:outline-none focus:border-rose focus:ring-1 focus:ring-rose bg-ivory-light text-burgundy"
                          />
                          <Lock className="w-4 h-4 text-burgundy/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingAuth}
                        className="btn-primary w-full py-3.5 text-xs font-semibold disabled:opacity-50 mt-2 shadow"
                      >
                        {isSubmittingAuth
                          ? "Signing In..."
                          : redirectUrl.includes("checkout")
                          ? "Sign In & Proceed to Checkout →"
                          : isShoppingRedirect
                          ? "Sign In & Proceed to Shopping →"
                          : "Sign In to Account"}
                      </button>

                      <div className="pt-2 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode("register");
                            setAuthError("");
                          }}
                          className="text-xs text-[#1F2A44]/80 hover:text-burgundy"
                        >
                          New to House of Laado?{" "}
                          <span className="font-semibold text-rose hover:underline">
                            Create an account
                          </span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Create Account Tab Form */
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-burgundy block mb-1">
                          Full Name
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            placeholder="Priya Sharma"
                            value={registerForm.name}
                            onChange={(e) =>
                              setRegisterForm({ ...registerForm, name: e.target.value })
                            }
                            className="w-full h-11 pl-10 pr-4 rounded-pill border border-blush text-xs focus:outline-none focus:border-rose focus:ring-1 focus:ring-rose bg-ivory-light text-burgundy"
                          />
                          <User className="w-4 h-4 text-burgundy/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-burgundy block mb-1">
                          Email Address
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            required
                            placeholder="priya@example.com"
                            value={registerForm.email}
                            onChange={(e) =>
                              setRegisterForm({ ...registerForm, email: e.target.value })
                            }
                            className="w-full h-11 pl-10 pr-4 rounded-pill border border-blush text-xs focus:outline-none focus:border-rose focus:ring-1 focus:ring-rose bg-ivory-light text-burgundy"
                          />
                          <Mail className="w-4 h-4 text-burgundy/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-burgundy block mb-1">
                          Mobile Phone Number
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            placeholder="+91 98765 43210"
                            value={registerForm.phone}
                            onChange={(e) =>
                              setRegisterForm({ ...registerForm, phone: e.target.value })
                            }
                            className="w-full h-11 pl-10 pr-4 rounded-pill border border-blush text-xs focus:outline-none focus:border-rose focus:ring-1 focus:ring-rose bg-ivory-light text-burgundy"
                          />
                          <Phone className="w-4 h-4 text-burgundy/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-burgundy block mb-1">
                          Password (min 6 characters)
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            required
                            minLength={6}
                            placeholder="••••••••"
                            value={registerForm.password}
                            onChange={(e) =>
                              setRegisterForm({ ...registerForm, password: e.target.value })
                            }
                            className="w-full h-11 pl-10 pr-4 rounded-pill border border-blush text-xs focus:outline-none focus:border-rose focus:ring-1 focus:ring-rose bg-ivory-light text-burgundy"
                          />
                          <Lock className="w-4 h-4 text-burgundy/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingAuth}
                        className="btn-primary w-full py-3.5 text-xs font-semibold disabled:opacity-50 mt-2 shadow"
                      >
                        {isSubmittingAuth
                          ? "Creating Account..."
                          : redirectUrl.includes("checkout")
                          ? "Create Account & Proceed to Checkout →"
                          : isShoppingRedirect
                          ? "Create Account & Proceed to Shopping →"
                          : "Create My Account"}
                      </button>

                      <div className="pt-2 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode("login");
                            setAuthError("");
                          }}
                          className="text-xs text-[#1F2A44]/80 hover:text-burgundy"
                        >
                          Already have an account?{" "}
                          <span className="font-semibold text-rose hover:underline">
                            Sign in here
                          </span>
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }


  // ---------------------------------------------------------------------------
  // VIEW B: Authenticated Customer Dashboard
  // ---------------------------------------------------------------------------
  return (
    <div className="bg-ivory-light min-h-screen">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumbs items={[{ label: "My Account" }]} />

        <div className="my-6 pb-4 border-b border-blush flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy">
              My Account
            </h1>
            <p className="text-xs sm:text-sm text-burgundy/85 mt-1">
              Namaste, <span className="font-bold text-burgundy">{user.name}</span> • {user.email}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-pill border border-blush text-xs font-semibold text-burgundy/80 hover:text-rose hover:border-rose transition-colors self-start sm:self-auto cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Navigation Sidebar (3 cols) */}
          <div className="lg:col-span-3 bg-blush-light border border-blush rounded-2xl p-4 space-y-1">
            <button
              onClick={() => setActiveTab("orders")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === "orders"
                  ? "bg-burgundy text-ivory-light shadow-sm"
                  : "text-burgundy/80 hover:text-burgundy hover:bg-ivory-light"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Orders & Dispatches ({orders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("returns")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === "returns"
                  ? "bg-burgundy text-ivory-light shadow-sm"
                  : "text-burgundy/80 hover:text-burgundy hover:bg-ivory-light"
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Returns & Refunds ({returns.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("addresses")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === "addresses"
                  ? "bg-burgundy text-ivory-light shadow-sm"
                  : "text-burgundy/80 hover:text-burgundy hover:bg-ivory-light"
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Saved Addresses</span>
            </button>

            <Link
              href="/wishlist"
              className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-burgundy/80 hover:text-burgundy hover:bg-ivory-light transition-colors"
            >
              <Heart className="w-4 h-4" />
              <span>My Wishlist ({wishlist.length})</span>
            </Link>

            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === "profile"
                  ? "bg-burgundy text-ivory-light shadow-sm"
                  : "text-burgundy/80 hover:text-burgundy hover:bg-ivory-light"
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profile Settings</span>
            </button>
          </div>

          {/* Main Content Area (9 cols) */}
          <div className="lg:col-span-9">
            {/* TAB 1: Orders & History */}
            {activeTab === "orders" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-blush">
                  <h3 className="font-serif font-bold text-lg text-burgundy">
                    Order History & Live Tracking
                  </h3>
                  <button
                    onClick={() => fetchCustomerOrders(token)}
                    className="text-xs text-rose font-semibold hover:underline cursor-pointer"
                  >
                    Refresh Orders
                  </button>
                </div>

                {isLoadingOrders ? (
                  <div className="p-12 text-center text-xs text-burgundy/80">
                    Loading your orders from atelier...
                  </div>
                ) : orders.length === 0 ? (
                  <div className="bg-blush-light border border-blush rounded-2xl p-10 text-center my-4">
                    <Package className="w-12 h-12 text-blush mx-auto mb-3 stroke-[1.2]" />
                    <h4 className="font-serif font-bold text-burgundy text-base mb-1">
                      No orders placed yet
                    </h4>
                    <p className="text-xs text-burgundy/80 max-w-sm mx-auto mb-6">
                      Explore our bestselling pure cotton suit sets, Sanganeri kurtas, and artisanal silhouettes.
                    </p>
                    <Link href="/shop" className="btn-primary text-xs">
                      Explore Collections
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => {
                      const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      });

                      const statusColors = {
                        placed: "bg-blush-light text-burgundy border-blush",
                        confirmed: "bg-olive/10 text-olive border-olive/30",
                        packed: "bg-blush-light/60 text-burgundy border-blush",
                        dispatched: "bg-olive/15 text-olive border-olive/30",
                        delivered: "bg-olive/10 text-olive border-olive/20",
                        cancelled: "bg-rose/10 text-rose border-rose/20",
                        return_requested: "bg-rose/10 text-rose border-rose/30",
                        returned: "bg-olive/10 text-olive border-olive/30",
                      };

                      return (
                        <div
                          key={order._id || order.orderNumber}
                          className="bg-ivory-light border border-blush rounded-2xl p-5 sm:p-6 shadow-sm space-y-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-blush/70">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-serif font-bold text-burgundy text-base">
                                  Order #{order.orderNumber}
                                </span>
                                <span
                                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-badge border uppercase tracking-wider ${
                                    statusColors[order.orderStatus] || "bg-blush-light text-burgundy border-blush"
                                  }`}
                                >
                                  {order.orderStatus}
                                </span>
                              </div>
                              <div className="flex items-center space-x-3 text-xs text-burgundy/70 mt-1">
                                <span className="flex items-center space-x-1">
                                  <Calendar className="w-3.5 h-3.5 text-burgundy/70" />
                                  <span>{orderDate}</span>
                                </span>
                                <span>•</span>
                                <span>Payment: {order.paymentMethod?.toUpperCase()} ({order.paymentStatus})</span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="font-serif font-bold text-lg text-burgundy">
                                ₹{order.pricing?.grandTotal || 0}
                              </span>
                              <Link
                                href={`/track-order?orderId=${encodeURIComponent(order.orderNumber)}`}
                                className="block text-xs text-rose font-semibold hover:underline mt-0.5"
                              >
                                View Tracking Timeline →
                              </Link>
                            </div>
                          </div>

                          {/* Items in order */}
                          <div className="space-y-3">
                            {(order.items || []).map((item, idx) => (
                              <div key={idx} className="flex items-center space-x-3.5">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-14 h-18 object-cover rounded-lg border border-blush flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-serif text-xs font-semibold text-burgundy truncate">
                                    {item.name}
                                  </h5>
                                  <p className="text-[11px] text-burgundy/70">
                                    Size: <strong className="text-burgundy">{item.size}</strong> • Color: <strong className="text-burgundy">{item.color || "Standard"}</strong> • Qty: <strong className="text-burgundy">{item.quantity}</strong>
                                  </p>
                                  <span className="text-xs font-bold text-burgundy">
                                    ₹{item.price?.toLocaleString("en-IN")}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Tracking & Courier strip */}
                          <div className="bg-blush-light/60 rounded-xl p-3 flex flex-wrap items-center justify-between text-xs text-burgundy/80 gap-2 border border-blush/40">
                            <div className="flex items-center space-x-2">
                              <Truck className="w-4 h-4 text-rose" />
                              <span>Courier: <strong className="text-burgundy">{order.tracking?.courierName || "Delhivery Express"}</strong></span>
                              {order.tracking?.trackingNumber && (
                                <span className="font-mono text-burgundy font-bold">({order.tracking.trackingNumber})</span>
                              )}
                            </div>
                            <span className="text-[11px] text-burgundy/60">
                              Shipping to: {order.shippingAddress?.city}, {order.shippingAddress?.pincode}
                            </span>
                          </div>

                          {/* Complete Action Strip */}
                          {(() => {
                            const currentStatus = (order.orderStatus || order.status || "").toLowerCase();
                            const isCancelled = currentStatus === "cancelled" || Boolean(order.cancellation?.cancelledAt);
                            const isCancellable = ["placed", "confirmed"].includes(currentStatus) && !isCancelled;
                            const isReturnable = currentStatus === "delivered";

                            const matchingReturn = returns.find(
                              (r) => r.order === order._id || r.order?._id === order._id || r.orderNumber === order.orderNumber
                            );
                            const hasRefundStatus =
                              (order.cancellation?.refundStatus && order.cancellation.refundStatus !== "not_applicable") ||
                              order.returnRequest ||
                              matchingReturn ||
                              ["return_requested", "returned"].includes(currentStatus);

                            return (
                              <div className="flex flex-wrap items-center justify-between pt-3 border-t border-blush/60 text-xs gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  {/* 1. View Details Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenDetailsModal(order)}
                                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-pill border border-[#1F2A44]/30 bg-ivory-light hover:bg-[#1F2A44] hover:text-ivory-light text-[#1F2A44] font-semibold text-xs transition-colors cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>View Details</span>
                                  </button>

                                  {/* 2. Cancel Order Button (Eligible: placed or confirmed) */}
                                  {isCancellable && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenCancelModal(order)}
                                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-pill border border-rose/40 bg-rose/5 hover:bg-rose hover:text-white text-rose font-semibold text-xs transition-colors cursor-pointer"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                      <span>Cancel Order</span>
                                    </button>
                                  )}

                                  {/* 3. Return / Exchange Button (Eligible: delivered) */}
                                  {order.orderStatus === "delivered" && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenReturnModal(order)}
                                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-pill border border-olive/40 bg-olive/5 hover:bg-olive hover:text-white text-olive font-semibold text-xs transition-colors cursor-pointer"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                      <span>Return / Exchange</span>
                                    </button>
                                  )}

                                  {/* 4. Refund Status Button (When applicable) */}
                                  {hasRefundStatus && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenRefundTrackingModal(order, matchingReturn || order.returnRequest)}
                                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-pill border border-[#C6A75E] bg-[#FAF7F2] hover:bg-[#C6A75E] hover:text-white text-[#1F2A44] font-semibold text-xs transition-colors cursor-pointer"
                                    >
                                      <Clock className="w-3.5 h-3.5 text-[#C6A75E]" />
                                      <span>Refund Status</span>
                                    </button>
                                  )}
                                </div>

                                <div className="flex items-center space-x-2 text-[11px] text-burgundy/60 ml-auto">
                                  {order.orderStatus === "cancelled" && (
                                    <span className="font-semibold text-rose bg-rose/10 px-2.5 py-0.5 rounded-pill border border-rose/30">
                                      Order Cancelled
                                    </span>
                                  )}
                                  {order.orderStatus === "return_requested" && (
                                    <span className="font-semibold text-rose bg-rose/10 px-2.5 py-0.5 rounded-pill border border-rose/30">
                                      Return Requested
                                    </span>
                                  )}
                                  <span>{order.items?.length || 0} item(s)</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: Returns & Refunds */}
            {activeTab === "returns" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-blush">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-burgundy">
                      Returns, Exchanges & Verified Refunds
                    </h3>
                    <p className="text-xs text-burgundy/70 mt-0.5">
                      Track reverse courier pickups, quality inspection progress, and refund settlements.
                    </p>
                  </div>
                  <button
                    onClick={() => fetchCustomerOrders(token)}
                    className="text-xs text-rose font-semibold hover:underline cursor-pointer"
                  >
                    Refresh Status
                  </button>
                </div>

                {returns.length === 0 ? (
                  <div className="bg-blush-light border border-blush rounded-2xl p-10 text-center my-4">
                    <RotateCcw className="w-12 h-12 text-blush mx-auto mb-3 stroke-[1.2]" />
                    <h4 className="font-serif font-bold text-burgundy text-base mb-1">
                      No active returns or exchange requests
                    </h4>
                    <p className="text-xs text-burgundy/80 max-w-sm mx-auto mb-4">
                      House of Laado offers a 7-day doorstep exchange guarantee on all delivered apparel in original condition with tags intact.
                    </p>
                    <button
                      onClick={() => setActiveTab("orders")}
                      className="btn-primary text-xs"
                    >
                      View Delivered Orders
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {returns.map((ret) => {
                      const reqDate = new Date(ret.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      });

                      const statusBadge = {
                        requested: "bg-amber-100 text-amber-900 border-amber-300",
                        approved: "bg-blue-100 text-blue-900 border-blue-300",
                        rejected: "bg-rose/15 text-rose border-rose/30",
                        pickup_scheduled: "bg-purple-100 text-purple-900 border-purple-300",
                        item_received: "bg-indigo-100 text-indigo-900 border-indigo-300",
                        inspection_passed: "bg-emerald-100 text-emerald-900 border-emerald-300",
                        inspection_failed: "bg-rose/20 text-rose border-rose/30",
                        refund_processing: "bg-amber-200 text-amber-950 border-amber-400",
                        completed: "bg-emerald-600 text-white border-emerald-700",
                      };

                      const statusLabels = {
                        requested: "Requested (Under Review)",
                        approved: "Approved for Pickup",
                        rejected: "Request Rejected",
                        pickup_scheduled: "Pickup Scheduled",
                        item_received: "Received at Atelier",
                        inspection_passed: "Inspection Passed",
                        inspection_failed: "Inspection Failed",
                        refund_processing: "Refund Processing",
                        completed: "Refund Completed",
                      };

                      return (
                        <div
                          key={ret._id || ret.requestId}
                          className="bg-ivory-light border border-blush rounded-2xl p-5 sm:p-6 shadow-sm space-y-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-blush/70">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-serif font-bold text-burgundy text-base">
                                  Request #{ret.requestId || ret._id}
                                </span>
                                <span
                                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-badge border uppercase tracking-wider ${
                                    statusBadge[ret.status] || "bg-blush-light text-burgundy border-blush"
                                  }`}
                                >
                                  {statusLabels[ret.status] || ret.status}
                                </span>
                              </div>
                              <div className="flex items-center space-x-3 text-xs text-burgundy/70 mt-1">
                                <span>Order #{ret.orderNumber || (ret.order?.orderNumber || "N/A")}</span>
                                <span>•</span>
                                <span>Requested: {reqDate}</span>
                                <span>•</span>
                                <span className="font-semibold text-burgundy capitalize">
                                  {ret.type === "exchange" ? "Size Exchange" : "Return & Refund"}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              {ret.type === "return_refund" ? (
                                <>
                                  <span className="font-serif font-bold text-lg text-burgundy">
                                    ₹{ret.refundAmount?.toLocaleString("en-IN") || 0}
                                  </span>
                                  <p className="text-[10px] text-burgundy/60">Eligible Refund</p>
                                </>
                              ) : (
                                <span className="inline-block px-2.5 py-1 rounded-badge bg-olive/10 text-olive text-xs font-semibold">
                                  Doorstep Exchange
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Items included in return */}
                          <div className="space-y-3">
                            {(ret.items || []).map((item, idx) => (
                              <div key={idx} className="flex items-center space-x-3.5 bg-blush-light/30 p-2.5 rounded-xl border border-blush/40">
                                {item.image && (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-12 h-16 object-cover rounded-lg border border-blush flex-shrink-0"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-serif text-xs font-semibold text-burgundy truncate">
                                    {item.name}
                                  </h5>
                                  <p className="text-[11px] text-burgundy/70">
                                    Size: <strong>{item.size}</strong> • Color: <strong>{item.color || "Standard"}</strong> • Qty: <strong>{item.quantity}</strong>
                                  </p>
                                  {item.exchangeSize && (
                                    <p className="text-[11px] font-semibold text-olive mt-0.5">
                                      Requested Replacement Size: {item.exchangeSize}
                                    </p>
                                  )}
                                </div>
                                <span className="text-xs font-bold text-burgundy">
                                  ₹{(item.price * item.quantity)?.toLocaleString("en-IN")}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Reason & notes strip */}
                          <div className="bg-[#FAF7F2] rounded-xl p-3 text-xs border border-[#C6A75E]/30 space-y-1">
                            <p className="text-burgundy/80">
                              <strong className="text-burgundy">Customer Reason:</strong> {ret.reason}
                            </p>
                            {ret.description && (
                              <p className="text-burgundy/70 italic text-[11px]">
                                &ldquo;{ret.description}&rdquo;
                              </p>
                            )}
                            {ret.decisionReason && (
                              <p className="text-rose font-semibold pt-1 border-t border-[#C6A75E]/20 text-[11px]">
                                Atelier Note: {ret.decisionReason}
                              </p>
                            )}
                          </div>

                          {/* Action Strip */}
                          <div className="flex items-center justify-between pt-2 border-t border-blush/40">
                            <button
                              type="button"
                              onClick={() => handleOpenRefundTrackingModal(ret.order, ret)}
                              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-pill border border-[#C6A75E] bg-[#FAF7F2] hover:bg-[#C6A75E] hover:text-white text-[#1F2A44] font-semibold text-xs transition-colors cursor-pointer"
                            >
                              <Clock className="w-3.5 h-3.5 text-[#C6A75E]" />
                              <span>Live Tracking & Reverse Courier Details →</span>
                            </button>

                            <span className="text-[11px] text-burgundy/60">
                              Updated {new Date(ret.updatedAt || ret.createdAt).toLocaleDateString("en-IN")}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Saved Addresses */}
            {activeTab === "addresses" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-blush">
                  <h3 className="font-serif font-bold text-lg text-burgundy">
                    Saved Shipping Addresses
                  </h3>
                  <button
                    onClick={() => setShowAddressForm(!showAddressForm)}
                    className="btn-outline text-xs py-1.5 px-3 flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Address</span>
                  </button>
                </div>

                {showAddressForm && (
                  <form onSubmit={handleAddAddress} className="bg-blush-light border border-blush rounded-2xl p-5 space-y-3">
                    <h4 className="font-serif font-bold text-burgundy text-sm mb-2">New Address Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        placeholder="Recipient Name"
                        value={newAddress.fullName}
                        onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                        className="h-10 px-3.5 rounded-pill border border-blush text-xs bg-ivory-light text-burgundy"
                      />
                      <input
                        type="tel"
                        required
                        placeholder="Phone Number"
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                        className="h-10 px-3.5 rounded-pill border border-blush text-xs bg-ivory-light text-burgundy"
                      />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Street Address, Flat, Landmark"
                      value={newAddress.streetAddress}
                      onChange={(e) => setNewAddress({ ...newAddress, streetAddress: e.target.value })}
                      className="w-full h-10 px-3.5 rounded-pill border border-blush text-xs bg-ivory-light text-burgundy"
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        required
                        placeholder="City"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="h-10 px-3.5 rounded-pill border border-blush text-xs bg-ivory-light text-burgundy"
                      />
                      <input
                        type="text"
                        required
                        placeholder="State"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        className="h-10 px-3.5 rounded-pill border border-blush text-xs bg-ivory-light text-burgundy"
                      />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="PIN Code"
                        value={newAddress.pincode}
                        onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                        className="h-10 px-3.5 rounded-pill border border-blush text-xs bg-ivory-light text-burgundy"
                      />
                    </div>
                    <div className="flex justify-end space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="btn-outline text-xs py-1.5 px-4"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary text-xs py-1.5 px-5">
                        Save Address
                      </button>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(user.addresses && user.addresses.length > 0
                    ? user.addresses
                    : [
                        {
                          fullName: user.name,
                          phone: user.phone || "+91 98765 43210",
                          streetAddress: "Plot 42, Civil Lines Enclave",
                          city: "Jaipur",
                          state: "Rajasthan",
                          pincode: "302006",
                        },
                      ]
                  ).map((addr, idx) => (
                    <div
                      key={idx}
                      className="bg-ivory-light border border-blush rounded-xl p-4 shadow-sm relative space-y-1.5 text-xs text-burgundy/80"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-burgundy font-serif text-sm">{addr.fullName}</strong>
                        {idx === 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blush text-burgundy">
                            Default
                          </span>
                        )}
                      </div>
                      <p>{addr.streetAddress}</p>
                      <p>{addr.city}, {addr.state} - <strong className="text-burgundy">{addr.pincode}</strong></p>
                      <p className="pt-1 text-burgundy/70">Phone: {addr.phone}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: Profile Settings */}
            {activeTab === "profile" && (
              <div className="bg-blush-light border border-blush rounded-2xl p-6 space-y-4 max-w-lg">
                <h3 className="font-serif font-bold text-lg text-burgundy pb-2 border-b border-blush">
                  Profile Details
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-burgundy block mb-1">Full Name</label>
                    <input
                      type="text"
                      disabled
                      value={user.name}
                      className="w-full h-10 px-3.5 rounded-pill border border-blush bg-ivory-light text-burgundy"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-burgundy block mb-1">Email Address</label>
                    <input
                      type="email"
                      disabled
                      value={user.email}
                      className="w-full h-10 px-3.5 rounded-pill border border-blush bg-ivory-light text-burgundy"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-burgundy block mb-1">Mobile Contact</label>
                    <input
                      type="tel"
                      disabled
                      value={user.phone || "+91 98765 43210"}
                      className="w-full h-10 px-3.5 rounded-pill border border-blush bg-ivory-light text-burgundy"
                    />
                  </div>

                  <p className="text-[11px] text-burgundy/70 pt-2">
                    To modify your login email or account role, please contact our support desk at {user.email}.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 1. Customer Order Details Modal */}
        <CustomerOrderDetailsModal
          isOpen={Boolean(selectedOrderForDetails)}
          order={selectedOrderForDetails}
          onClose={() => setSelectedOrderForDetails(null)}
          onCancelClick={(ord) => {
            setSelectedOrderForDetails(null);
            setSelectedOrderForCancel(ord);
          }}
          onReturnClick={(ord) => {
            setSelectedOrderForDetails(null);
            setSelectedOrderForReturn(ord);
          }}
          onRefundClick={(ord) => {
            setSelectedOrderForDetails(null);
            const matchingReturn = returns.find(
              (r) => r.order === ord._id || r.order?._id === ord._id || r.orderNumber === ord.orderNumber
            );
            setSelectedRefundTracking({ order: ord, returnRequest: matchingReturn || ord.returnRequest });
          }}
        />

        {/* 2. Customer Cancel Order Modal */}
        <CancelOrderModal
          isOpen={Boolean(selectedOrderForCancel)}
          order={selectedOrderForCancel}
          token={token}
          onClose={() => setSelectedOrderForCancel(null)}
          onSuccess={(updatedOrder) => {
            setSelectedOrderForCancel(null);
            if (updatedOrder) {
              setOrders((prev) =>
                prev.map((o) =>
                  o._id === updatedOrder._id || o.orderNumber === updatedOrder.orderNumber
                    ? { ...o, ...updatedOrder, orderStatus: "cancelled" }
                    : o
                )
              );
            }
            fetchCustomerOrders(token);
          }}
        />

        {/* 3. Customer Return / Exchange Modal */}
        <ReturnRequestModal
          isOpen={Boolean(selectedOrderForReturn)}
          order={selectedOrderForReturn}
          token={token}
          onClose={() => setSelectedOrderForReturn(null)}
          onSuccess={() => {
            setSelectedOrderForReturn(null);
            fetchCustomerOrders(token);
          }}
        />

        {/* 4. Customer Refund & Return Tracking Modal */}
        <RefundTrackingModal
          isOpen={Boolean(selectedRefundTracking)}
          order={selectedRefundTracking?.order}
          returnRequest={selectedRefundTracking?.returnRequest}
          onClose={() => setSelectedRefundTracking(null)}
        />
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ivory-light flex items-center justify-center p-12">
          <div className="w-8 h-8 rounded-full border-2 border-rose border-t-transparent animate-spin" />
        </div>
      }
    >
      <AccountContent />
    </Suspense>
  );
}
