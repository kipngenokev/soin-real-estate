import { Router } from "express";
import { Role } from "@prisma/client";
import { propertyController } from "../controllers/property.controller";
import { unitController } from "../controllers/unit.controller";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(requireAuth, requireRole(Role.ADMIN));

router.get("/", asyncHandler(propertyController.list));
router.post("/", asyncHandler(propertyController.create));
router.get("/:id", asyncHandler(propertyController.get));
router.put("/:id", asyncHandler(propertyController.update));
router.delete("/:id", asyncHandler(propertyController.remove));

// Nested units under a property
router.get("/:propertyId/units", asyncHandler(unitController.listForProperty));
router.post("/:propertyId/units", asyncHandler(unitController.create));

export default router;
