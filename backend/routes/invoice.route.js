import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { createInvoice, getInvoiceById, getInvoiceByNumber, getInvoices } from "../controllers/inovice.controller.js";



const invoice = express.Router();

// Owner + Worker
invoice.post("/", protect, createInvoice);

invoice.get("/", protect, getInvoices);

invoice.get(
  "/number/:invoiceNumber",
  protect,
  getInvoiceByNumber
);

invoice.get(
  "/:id",
  protect,
  getInvoiceById
);

export default invoice;