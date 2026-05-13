import { Router } from "express";
import { Role } from "@prisma/client";
import { issueController } from "../controllers/issue.controller";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(requireAuth, requireRole(Role.ADMIN));

router.get("/", asyncHandler(issueController.list));
router.get("/:id", asyncHandler(issueController.get));
router.post("/:id/resolve", asyncHandler(issueController.resolve));

export default router;
