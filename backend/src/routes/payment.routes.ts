import { Router } from "express";
import { Role } from "@prisma/client";
import { paymentController } from "../controllers/payment.controller";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(requireAuth, requireRole(Role.ADMIN));

router.get("/", asyncHandler(paymentController.list));
router.get("/summary", asyncHandler(paymentController.summary));
router.post("/", asyncHandler(paymentController.create));
router.get("/:id", asyncHandler(paymentController.get));
router.put("/:id", asyncHandler(paymentController.update));
router.delete("/:id", asyncHandler(paymentController.remove));

export default router;
