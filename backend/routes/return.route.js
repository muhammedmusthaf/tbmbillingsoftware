import express from "express";
import { ownerOnly, protect } from "../middleware/auth.middleware.js";
import { createReturn, getInvoiceReturns, getReturnById, getReturns } from "../controllers/return.controller.js";


const returnrouter = express.Router();

// Owner + worker can process a customer return
returnrouter.post(
  "/",
  protect,
  createReturn
);

// Owner can view complete return history
returnrouter.get(
  "/",
  protect,
  ownerOnly,
  getReturns
);

// Returns belonging to one invoice
returnrouter.get(
  "/invoice/:invoiceId",
  protect,
  getInvoiceReturns
);

// Single return
returnrouter.get(
  "/:id",
  protect,
  getReturnById
);

export default returnrouter;