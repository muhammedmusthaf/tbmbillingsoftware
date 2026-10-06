import express from "express";
import { getSettings, updateSettings } from "../controllers/setting.controller.js";
import { ownerOnly, protect } from "../middleware/auth.middleware.js";



const setting = express.Router();

// Owner can view shop settings
setting.get(
  "/",
  protect,
  ownerOnly,
  getSettings
);

// Owner can update shop settings
setting.put(
  "/",
  protect,
  ownerOnly,
  updateSettings
);

export default setting;