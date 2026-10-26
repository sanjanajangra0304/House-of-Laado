import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import { connectDB, disconnectDB } from "../src/config/db.js";
import { User, OtpRequest } from "../src/models/index.js";

describe("Forgot Password & OTP Auth Flow Tests", () => {
  const testEmail = `patron_test_${Date.now()}@houseoflaado.com`;
  const testPhone = "+919876543210";
  const initialPassword = "OldPassword123!";
  const newPassword = "NewPassword456!";
  let devOtp = null;

  before(async () => {
    await connectDB();
    // Create a verified test customer
    await User.create({
      name: "Test Jaipur Patron",
      email: testEmail,
      phone: testPhone,
      password: initialPassword,
      role: "customer",
      isActive: true,
    });
  });

  after(async () => {
    await User.deleteOne({ email: testEmail });
    await OtpRequest.deleteMany({ email: testEmail });
    await disconnectDB();
  });

  test("1. Request OTP using registered email returns success and generates devOtp", async () => {
    const res = await request(app)
      .post("/api/v1/auth/forgot-password/send-otp")
      .send({ identifier: testEmail });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.devOtp, "Should include devOtp in non-production response");
    assert.equal(res.body.data.channel, "email");
    devOtp = res.body.data.devOtp;
  });

  test("2. Fails to send OTP for an unregistered email/phone", async () => {
    const res = await request(app)
      .post("/api/v1/auth/forgot-password/send-otp")
      .send({ identifier: "non_existent_patron_9999@houseoflaado.com" });

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });

  test("3. Fails to verify OTP with incorrect code", async () => {
    const res = await request(app)
      .post("/api/v1/auth/forgot-password/verify-otp")
      .send({
        identifier: testEmail,
        otp: "000000",
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  test("4. Successfully verifies OTP, updates password, and returns auth token", async () => {
    const res = await request(app)
      .post("/api/v1/auth/forgot-password/verify-otp")
      .send({
        identifier: testEmail,
        otp: devOtp,
        newPassword: newPassword,
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token, "Should return auth token for instant login");
    assert.equal(res.body.data.user.email, testEmail);

    // Verify user can now log in with the new password
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: testEmail,
        password: newPassword,
      });

    assert.equal(loginRes.status, 200);
    assert.equal(loginRes.body.success, true);
  });

  test("5. Request OTP using registered phone number", async () => {
    const res = await request(app)
      .post("/api/v1/auth/forgot-password/send-otp")
      .send({ identifier: testPhone });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.devOtp);
    assert.equal(res.body.data.channel, "phone");

    // Verify OTP directly via phone number
    const verifyRes = await request(app)
      .post("/api/v1/auth/forgot-password/verify-otp")
      .send({
        identifier: testPhone,
        otp: res.body.data.devOtp,
      });

    assert.equal(verifyRes.status, 200);
    assert.equal(verifyRes.body.success, true);
    assert.ok(verifyRes.body.data.token);
  });
});
