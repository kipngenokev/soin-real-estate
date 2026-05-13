import { Router } from "express";
import { Role } from "@prisma/client";
import { tenantController } from "../controllers/tenant.controller";
import { paymentController } from "../controllers/payment.controller";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(requireAuth, requireRole(Role.ADMIN));

router.get("/", asyncHandler(tenantController.list));
router.post("/", asyncHandler(tenantController.create));
router.get("/:id", asyncHandler(tenantController.get));
router.put("/:id", asyncHandler(tenantController.update));
router.delete("/:id", asyncHandler(tenantController.remove));

router.post("/:id/leases", asyncHandler(tenantController.assignLease));
router.post("/:id/leases/end", asyncHandler(tenantController.endLease));

router.get("/:id/payments", asyncHandler(paymentController.forTenant));

export default router;
