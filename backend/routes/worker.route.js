import express from "express";
import { ownerOnly, protect } from "../middleware/auth.middleware.js";
import { changeWorkerStatus, createWorker, getWorkerById, getWorkers, updateWorker } from "../controllers/work.controller.js";


const worker = express.Router();

// All worker management = OWNER ONLY

// Create worker
worker.post(
  "/",
  protect,
  ownerOnly,
  createWorker
);

// Get all workers
worker.get(
  "/",
  protect,
  ownerOnly,
  getWorkers
);

// Get single worker
worker.get(
  "/:id",
  protect,
  ownerOnly,
  getWorkerById
);

// Update worker
worker.put(
  "/:id",
  protect,
  ownerOnly,
  updateWorker
);

// Activate / Deactivate worker
worker.patch(
  "/:id/status",
  protect,
  ownerOnly,
  changeWorkerStatus
);

export default worker;