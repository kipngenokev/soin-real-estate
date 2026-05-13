import { Router } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import authRoutes from "./auth.routes";
import propertyRoutes from "./property.routes";
import unitRoutes from "./unit.routes";
import tenantRoutes from "./tenant.routes";
import leaseRoutes from "./lease.routes";
import paymentRoutes from "./payment.routes";
import issueRoutes from "./issue.routes";
import portalRoutes from "./portal.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json(ApiResponse.success({ status: "ok" }));
});

router.use("/auth", authRoutes);
router.use("/properties", propertyRoutes);
router.use("/units", unitRoutes);
router.use("/tenants", tenantRoutes);
router.use("/leases", leaseRoutes);
router.use("/payments", paymentRoutes);
router.use("/issues", issueRoutes);
router.use("/portal", portalRoutes);

export default router;
