import { Router } from "express";
import { Role } from "@prisma/client";
import { issueController } from "../controllers/issue.controller";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(requireAuth, requireRole(Role.TENANT));

router.get("/issues", asyncHandler(issueController.listForMe));
router.post("/issues", asyncHandler(issueController.createForMe));

export default router;
