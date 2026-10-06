import express from "express";
import { ownerOnly, protect } from "../middleware/auth.middleware.js";
import { getProductSalesReport, getSalesReport } from "../controllers/report.controller.js";


const report = express.Router();

// Owner only - Sales report
report.get(
  "/sales",
  protect,
  ownerOnly,
  getSalesReport
);

// Owner only - Product / Top-selling report
report.get(
  "/products",
  protect,
  ownerOnly,
  getProductSalesReport
);

export default report;