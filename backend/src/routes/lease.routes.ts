import { Router } from "express";
import { Role } from "@prisma/client";
import { leaseController } from "../controllers/lease.controller";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(requireAuth, requireRole(Role.ADMIN));

router.get("/", asyncHandler(leaseController.list));
router.post("/", asyncHandler(leaseController.create));
router.get("/:id", asyncHandler(leaseController.get));
router.delete("/:id", asyncHandler(leaseController.remove));

router.post("/:id/activate", asyncHandler(leaseController.activate));
router.post("/:id/end", asyncHandler(leaseController.end));

export default router;
