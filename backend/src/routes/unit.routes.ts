import { Router } from "express";
import { Role } from "@prisma/client";
import { unitController } from "../controllers/unit.controller";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(requireAuth, requireRole(Role.ADMIN));

router.get("/", asyncHandler(unitController.list));
router.get("/:id", asyncHandler(unitController.get));
router.put("/:id", asyncHandler(unitController.update));
router.patch("/:id/status", asyncHandler(unitController.setStatus));
router.delete("/:id", asyncHandler(unitController.remove));

export default router;
