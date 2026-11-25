
import express from "express";
import { getSettings, updateSettings } from "../controllers/setting.controller.js";
import { ownerOnly, protect } from "../middleware/auth.middleware.js";

const setting = express.Router();

// Owner + Worker can VIEW shop settings
setting.get("/", protect, getSettings);

// Only Owner can UPDATE shop settings
setting.put("/", protect, ownerOnly, updateSettings);

export default setting;
