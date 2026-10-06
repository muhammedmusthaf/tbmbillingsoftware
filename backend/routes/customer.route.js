import express from "express";
import { ownerOnly, protect } from "../middleware/auth.middleware.js";
import { addCustomer, deactivateCustomer, getCustomerById, getCustomers, searchCustomers, updateCustomer } from "../controllers/customer.controller.js";


// Owner + Worker
const customer = express.Router();
customer.get("/", protect, getCustomers);
customer.get("/search", protect, searchCustomers);
customer.get("/:id", protect, getCustomerById);
customer.post("/", protect, addCustomer);
customer.put("/:id", protect, updateCustomer);

// Owner only
customer.patch(
  "/:id/deactivate",
  protect,
  ownerOnly,
  deactivateCustomer
);

export default customer;