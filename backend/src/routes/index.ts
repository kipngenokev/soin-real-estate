import { Router } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import authRoutes from "./auth.routes";
import propertyRoutes from "./property.routes";
import unitRoutes from "./unit.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json(ApiResponse.success({ status: "ok" }));
});

router.use("/auth", authRoutes);
router.use("/properties", propertyRoutes);
router.use("/units", unitRoutes);

export default router;
