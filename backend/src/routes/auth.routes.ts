import { Router } from "express";
import { Role } from "@prisma/client";
import { authController } from "../controllers/auth.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";

const router = Router();

router.post("/login", asyncHandler(authController.login));
router.post("/refresh", asyncHandler(authController.refresh));
router.post("/logout", asyncHandler(authController.logout));

router.get("/me", requireAuth, asyncHandler(authController.me));

// Admin-only: create tenant or admin users
router.post(
  "/register",
  requireAuth,
  requireRole(Role.ADMIN),
  asyncHandler(authController.register)
);

export default router;
