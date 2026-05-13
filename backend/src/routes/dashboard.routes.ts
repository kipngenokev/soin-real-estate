import { Router } from "express";
import { Role } from "@prisma/client";
import { dashboardController } from "../controllers/dashboard.controller";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(requireAuth, requireRole(Role.ADMIN));

router.get("/stats", asyncHandler(dashboardController.stats));

export default router;
