import express from "express";
import { ownerOnly, protect } from "../middleware/auth.middleware.js";
import { getCreditPayments, getCustomerCreditPayments, receiveCreditPayment } from "../controllers/credit.controller.js";



const credit = express.Router();

// Owner + Worker can receive customer payments
credit.post(
    "/payment",
    protect,
    receiveCreditPayment
);

// Owner can view all credit payment history
credit.get(
    "/payments",
    protect,
    ownerOnly,
    getCreditPayments
);

// Customer-specific payment history
credit.get(
    "/customer/:customerId",
    protect,
    getCustomerCreditPayments
);

export default credit;