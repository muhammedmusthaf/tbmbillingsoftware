import Return from "../models/Return.model.js";

import Product from "../models/Product.model.js";
import Customer from "../models/Customer.model.js";
import Invoice from "../models/Invoice.model.js";


// CREATE RETURN
export const createReturn = async (req, res) => {
  try {
    const {
      invoiceId,
      items,
      refundMethod,
      reason,
      notes,
    } = req.body;

    // -----------------------------------
    // BASIC VALIDATION
    // -----------------------------------

    if (!invoiceId) {
      return res.status(400).json({
        message: "Invoice is required",
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "At least one return item is required",
      });
    }

    if (
      !["cash", "upi", "credit_adjustment"].includes(
        refundMethod
      )
    ) {
      return res.status(400).json({
        message: "Invalid refund method",
      });
    }

    // -----------------------------------
    // FIND ORIGINAL INVOICE
    // -----------------------------------

    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    if (invoice.status === "cancelled") {
      return res.status(400).json({
        message: "Cancelled invoice cannot be returned",
      });
    }

    // -----------------------------------
    // FIND PREVIOUS RETURNS
    // -----------------------------------

    const previousReturns = await Return.find({
      invoice: invoice._id,
    });

    // Track previously returned quantity
    const previouslyReturned = {};

    for (const oldReturn of previousReturns) {
      for (const item of oldReturn.items) {
        const productId = item.product.toString();

        previouslyReturned[productId] =
          (previouslyReturned[productId] || 0) +
          item.quantity;
      }
    }

    // Prevent same product twice in request
    const requestProductIds = new Set();

    const returnItems = [];

    let totalRefundAmount = 0;

    // -----------------------------------
    // VALIDATE RETURN ITEMS
    // -----------------------------------

    for (const returnItem of items) {
      const {
        productId,
        quantity,
        restock = true,
      } = returnItem;

      if (!productId) {
        return res.status(400).json({
          message: "Product is required",
        });
      }

      if (requestProductIds.has(productId)) {
        return res.status(400).json({
          message:
            "Same product cannot appear twice in one return",
        });
      }

      requestProductIds.add(productId);

      const returnQuantity = Number(quantity);

      if (!returnQuantity || returnQuantity <= 0) {
        return res.status(400).json({
          message: "Return quantity must be greater than 0",
        });
      }

      // Find product inside original invoice
      const invoiceItem = invoice.items.find(
        (item) =>
          item.product.toString() === productId
      );

      if (!invoiceItem) {
        return res.status(400).json({
          message:
            "Product does not belong to this invoice",
        });
      }

      const alreadyReturned =
        previouslyReturned[productId] || 0;

      const availableToReturn =
        invoiceItem.quantity - alreadyReturned;

      if (returnQuantity > availableToReturn) {
        return res.status(400).json({
          message: `Only ${availableToReturn} ${invoiceItem.unit} of ${invoiceItem.productName} can be returned`,
          soldQuantity: invoiceItem.quantity,
          alreadyReturned,
          availableToReturn,
        });
      }

      // -----------------------------------
      // REFUND CALCULATION
      // -----------------------------------

      // Uses actual final amount from original invoice.
      // Therefore original discount + GST are respected.
      const pricePerUnit =
        invoiceItem.total / invoiceItem.quantity;

      const refundAmount = Number(
        (pricePerUnit * returnQuantity).toFixed(2)
      );

      totalRefundAmount += refundAmount;

      returnItems.push({
        product: invoiceItem.product,

        productName:
          invoiceItem.productName,

        productCode:
          invoiceItem.productCode,

        unit:
          invoiceItem.unit,

        quantity:
          returnQuantity,

        rate:
          invoiceItem.rate,

        gst:
          invoiceItem.gst,

        refundAmount,

        restock:
          Boolean(restock),
      });
    }

    totalRefundAmount = Number(
      totalRefundAmount.toFixed(2)
    );

    // -----------------------------------
    // CUSTOMER
    // -----------------------------------

    let customer = null;

    if (invoice.customer) {
      customer = await Customer.findById(
        invoice.customer
      );
    }

    // Credit adjustment requires customer
    if (
      refundMethod === "credit_adjustment" &&
      !customer
    ) {
      return res.status(400).json({
        message:
          "Credit adjustment requires a registered customer",
      });
    }

    // Don't silently remove more credit than customer owes
    if (
      refundMethod === "credit_adjustment" &&
      totalRefundAmount > customer.creditBalance
    ) {
      return res.status(400).json({
        message:
          "Refund amount is greater than customer's outstanding credit",
        refundAmount: totalRefundAmount,
        creditBalance: customer.creditBalance,
      });
    }

    // -----------------------------------
    // CREATE RETURN
    // -----------------------------------

    const newReturn = await Return.create({
      invoice: invoice._id,

      invoiceNumber:
        invoice.invoiceNumber,

      customer:
        customer?._id || null,

      customerName:
        customer?.name ||
        invoice.customerName ||
        "Walk-in Customer",

      items:
        returnItems,

      totalRefundAmount,

      refundMethod,

      reason:
        reason || "",

      notes:
        notes || "",

      processedBy:
        req.user._id,
    });

    // -----------------------------------
    // RESTORE STOCK
    // -----------------------------------

    for (const item of returnItems) {
      if (item.restock) {
        const product = await Product.findById(
          item.product
        );

        if (product) {
          product.stock += item.quantity;

          await product.save();
        }
      }
    }

    // -----------------------------------
    // CUSTOMER TOTALS
    // -----------------------------------

    if (customer) {
      customer.totalPurchases = Number(
        Math.max(
          0,
          customer.totalPurchases -
            totalRefundAmount
        ).toFixed(2)
      );

      // Customer owes less money
      if (refundMethod === "credit_adjustment") {
        customer.creditBalance = Number(
          Math.max(
            0,
            customer.creditBalance -
              totalRefundAmount
          ).toFixed(2)
        );

        // Reduce pending credit on this invoice too
        invoice.creditAmount = Number(
          Math.max(
            0,
            invoice.creditAmount -
              totalRefundAmount
          ).toFixed(2)
        );

        if (invoice.creditAmount === 0) {
          invoice.paymentStatus = "paid";
        } else {
          invoice.paymentStatus = "partial";
        }
      }

      await customer.save();
    }

    // -----------------------------------
    // CHECK WHETHER ENTIRE INVOICE RETURNED
    // -----------------------------------

    const allReturns = await Return.find({
      invoice: invoice._id,
    });

    const totalReturnedMap = {};

    for (const returnDoc of allReturns) {
      for (const item of returnDoc.items) {
        const id = item.product.toString();

        totalReturnedMap[id] =
          (totalReturnedMap[id] || 0) +
          item.quantity;
      }
    }

    const fullyReturned = invoice.items.every(
      (item) => {
        const returned =
          totalReturnedMap[
            item.product.toString()
          ] || 0;

        return returned >= item.quantity;
      }
    );

    if (fullyReturned) {
      invoice.status = "returned";
    }

    await invoice.save();

    // -----------------------------------
    // FINAL RESPONSE
    // -----------------------------------

    const finalReturn =
      await Return.findById(newReturn._id)
        .populate(
          "customer",
          "name phone creditBalance"
        )
        .populate(
          "invoice",
          "invoiceNumber grandTotal paidAmount creditAmount paymentStatus status"
        )
        .populate(
          "items.product",
          "name productCode stock unit"
        )
        .populate(
          "processedBy",
          "name username role"
        );

    res.status(201).json({
      message: "Return processed successfully",
      return: finalReturn,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
// GET ALL RETURNS
export const getReturns = async (req, res) => {
  try {
    const {
      search,
      refundMethod,
      startDate,
      endDate,
    } = req.query;

    const filter = {};

    // Refund method filter
    if (refundMethod) {
      filter.refundMethod = refundMethod;
    }

    // Date filter
    if (startDate || endDate) {
      filter.returnDate = {};

      if (startDate) {
        filter.returnDate.$gte =
          new Date(startDate);
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        filter.returnDate.$lte = end;
      }
    }

    // Search by invoice/customer
    if (search) {
      filter.$or = [
        {
          invoiceNumber: {
            $regex: search,
            $options: "i",
          },
        },
        {
          customerName: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const returns = await Return.find(filter)
      .populate(
        "customer",
        "name phone"
      )
      .populate(
        "invoice",
        "invoiceNumber grandTotal status"
      )
      .populate(
        "processedBy",
        "name username role"
      )
      .sort({
        returnDate: -1,
      });

    res.status(200).json({
      count: returns.length,
      returns,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// GET SINGLE RETURN
export const getReturnById = async (req, res) => {
  try {
    const returnData = await Return.findById(
      req.params.id
    )
      .populate(
        "customer",
        "name phone address email gstin creditBalance"
      )
      .populate(
        "invoice",
        "invoiceNumber grandTotal paidAmount creditAmount paymentStatus status"
      )
      .populate(
        "items.product",
        "name productCode category brand stock unit"
      )
      .populate(
        "processedBy",
        "name username role"
      );

    if (!returnData) {
      return res.status(404).json({
        message: "Return not found",
      });
    }

    res.status(200).json({
      return: returnData,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// GET RETURNS FOR ONE INVOICE
export const getInvoiceReturns = async (
  req,
  res
) => {
  try {
    const returns = await Return.find({
      invoice: req.params.invoiceId,
    })
      .populate(
        "items.product",
        "name productCode unit"
      )
      .populate(
        "processedBy",
        "name username"
      )
      .sort({
        returnDate: -1,
      });

    const totalRefunded = returns.reduce(
      (total, item) =>
        total + item.totalRefundAmount,
      0
    );

    res.status(200).json({
      count: returns.length,

      totalRefunded: Number(
        totalRefunded.toFixed(2)
      ),

      returns,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};