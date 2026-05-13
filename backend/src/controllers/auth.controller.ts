import type { RequestHandler } from "express";
import { ApiResponse } from "../utils/ApiResponse";

export const login: RequestHandler = (_req, res) => {
  res.status(200).json(ApiResponse.success(null, "login endpoint placeholder"));
};

export const register: RequestHandler = (_req, res) => {
  res.status(200).json(ApiResponse.success(null, "register endpoint placeholder"));
};
