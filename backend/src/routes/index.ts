import { Router } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import authRoutes from "./auth.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json(ApiResponse.success({ status: "ok" }));
});

router.use("/auth", authRoutes);

export default router;
