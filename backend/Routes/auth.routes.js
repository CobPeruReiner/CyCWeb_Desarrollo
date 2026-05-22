const express = require("express");

const {
  Login,
  Logout,
  GetLastTableId,
  ReLogin,
  logOutInactividad,
} = require("../Controllers/auth.controller");

const { authMiddleware } = require("../Middleware/auth");

const { verifyOtp } = require("../Utils/VerifyOtp");

const {
  requestPasswordReset,
  verifyPasswordOtp,
  resetPassword,
} = require("../Controllers/passwordRecovery.controller");

const authRoutes = express.Router();

authRoutes.post("/login", Login);

authRoutes.post("/verify-otp", verifyOtp);

authRoutes.post("/logout", Logout);

authRoutes.post("/relogin", ReLogin);

authRoutes.post("/getlasttableid/:idTabla", GetLastTableId);

authRoutes.post("/logout-inactividad", authMiddleware, logOutInactividad);

authRoutes.post("/password/request", requestPasswordReset);

authRoutes.post("/password/verify", verifyPasswordOtp);

authRoutes.post("/password/reset", resetPassword);

module.exports = { authRoutes };
