import express from "express";
import { ownerOnly, protect } from "../middleware/auth.middleware.js";
import { getDashboard } from "../controllers/dashboard.controller.js";



const dashboard = express.Router();

// Owner dashboard
dashboard.get(
  "/",
  protect,
  ownerOnly,
  getDashboard
);

export default dashboard;