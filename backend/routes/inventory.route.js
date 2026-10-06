import express from "express";
import { ownerOnly, protect } from "../middleware/auth.middleware.js";
import { getStockHistory, stockIn } from "../controllers/inventory.controller.js";



const inventory = express.Router();

// Owner can add incoming stock
inventory.post("/stock-in", protect, ownerOnly, stockIn);

// Owner can view stock transaction history
inventory.get("/history", protect, ownerOnly, getStockHistory);

export default inventory;