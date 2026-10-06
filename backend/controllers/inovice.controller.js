import Invoice from "../models/Invoice.model.js";
import Product from "../models/Product.model.js";
import Customer from "../models/Customer.model.js";
import generateInvoiceNumber from "../utils/generateInvoiceNumber.js";
import Setting from "../models/Setting.model.js";
import mongoose from "mongoose";


// ==========================================
// CREATE INVOICE / BILL
// ==========================================

export const createInvoice = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const {
      customerId,
      items,
      paymentMethod,
      cashAmount = 0,
      upiAmount = 0,
      upiReference = "",
      billDiscount = 0,
      roundOff = 0,
      dueDate,
      notes,
    } = req.body;


    // -----------------------------
    // BASIC VALIDATION
    // -----------------------------

    if (
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        message: "At least one product is required",
      });
    }


    if (
      !["cash", "upi", "credit", "split"].includes(
        paymentMethod
      )
    ) {
      return res.status(400).json({
        message: "Invalid payment method",
      });
    }


    // -----------------------------
    // VALIDATE PRODUCT IDS
    // -----------------------------

    for (const item of items) {
      if (
        !item.productId ||
        !mongoose.Types.ObjectId.isValid(
          item.productId
        )
      ) {
        return res.status(400).json({
          message: "Invalid product ID",
        });
      }
    }


    // -----------------------------
    // CHECK DUPLICATE PRODUCTS
    // -----------------------------

    const productIds = items.map((item) =>
      item.productId.toString()
    );

    const uniqueProductIds =
      new Set(productIds);


    if (
      uniqueProductIds.size !==
      productIds.length
    ) {
      return res.status(400).json({
        message:
          "Duplicate products are not allowed in the same invoice",
      });
    }


    // -----------------------------
    // VALIDATE CUSTOMER ID
    // -----------------------------

    if (
      customerId &&
      !mongoose.Types.ObjectId.isValid(
        customerId
      )
    ) {
      return res.status(400).json({
        message: "Invalid customer ID",
      });
    }


    // ==========================================
    // START TRANSACTION
    // ==========================================

    session.startTransaction();


    // -----------------------------
    // GET CUSTOMER
    // -----------------------------

    let customer = null;


    if (customerId) {
      customer =
        await Customer.findById(
          customerId
        ).session(session);


      if (
        !customer ||
        !customer.isActive
      ) {
        await session.abortTransaction();

        return res.status(404).json({
          message: "Customer not found",
        });
      }
    }


    // Credit cannot be given to anonymous customer

    if (
      (
        paymentMethod === "credit" ||
        paymentMethod === "split"
      ) &&
      !customer
    ) {
      await session.abortTransaction();

      return res.status(400).json({
        message:
          "Customer is required for credit payment",
      });
    }


    // -----------------------------
    // VALIDATE PRODUCTS FIRST
    // -----------------------------

    const validatedItems = [];


    for (const item of items) {
      const product =
        await Product.findById(
          item.productId
        ).session(session);


      if (
        !product ||
        !product.isActive
      ) {
        await session.abortTransaction();

        return res.status(404).json({
          message:
            "One of the selected products was not found",
        });
      }


      const quantity =
        Number(item.quantity);


      if (
        !quantity ||
        quantity <= 0
      ) {
        await session.abortTransaction();

        return res.status(400).json({
          message:
            `Invalid quantity for ${product.name}`,
        });
      }


      if (
        product.stock < quantity
      ) {
        await session.abortTransaction();

        return res.status(400).json({
          message:
            `Insufficient stock for ${product.name}`,

          availableStock:
            product.stock,

          requestedQuantity:
            quantity,
        });
      }


      validatedItems.push({
        product,
        quantity,
        discount:
          Number(item.discount || 0),
      });
    }
    // -----------------------------
// GET SETTINGS
// -----------------------------

const settings =
  await Setting.findOne()
    .session(session);

const showGST =
  settings?.showGST === true;



    // -----------------------------
    // CALCULATE BILL
    // -----------------------------

    const invoiceItems = [];

    let subtotal = 0;
    let totalGST = 0;
    let totalItemDiscount = 0;


    for (const item of validatedItems) {
      const {
        product,
        quantity,
      } = item;


      const rate =
        Number(product.sellingPrice);

     const gstPercent =
  showGST
    ? Number(product.gst || 0)
    : 0;


      // Discount is percentage per item

      const discountPercent =
        Math.min(
          Math.max(
            Number(item.discount || 0),
            0
          ),
          100
        );


      const baseAmount =
        rate * quantity;


      const itemDiscount =
        (
          baseAmount *
          discountPercent
        ) / 100;


      const taxableAmount =
        baseAmount -
        itemDiscount;


      const gstAmount =
        (
          taxableAmount *
          gstPercent
        ) / 100;


      const itemTotal =
        taxableAmount +
        gstAmount;


      subtotal +=
        baseAmount;

      totalItemDiscount +=
        itemDiscount;

      totalGST +=
        gstAmount;


      invoiceItems.push({
        product:
          product._id,

        productName:
          product.name,

        productCode:
          product.productCode,

        unit:
          product.unit,

        quantity,

        purchasePrice:
          Number(
            product.purchasePrice || 0
          ),

        rate,

        gst:
          gstPercent,

        discount:
          discountPercent,

        taxableAmount:
          Number(
            taxableAmount.toFixed(2)
          ),

        gstAmount:
          Number(
            gstAmount.toFixed(2)
          ),

        total:
          Number(
            itemTotal.toFixed(2)
          ),
      });
    }


    // -----------------------------
    // BILL DISCOUNT
    // -----------------------------

    const additionalBillDiscount =
      Math.max(
        Number(
          billDiscount || 0
        ),
        0
      );


    const totalDiscount =
      totalItemDiscount +
      additionalBillDiscount;


    // -----------------------------
    // GRAND TOTAL
    // -----------------------------

    let grandTotal =
      subtotal -
      totalItemDiscount +
      totalGST -
      additionalBillDiscount +
      Number(roundOff || 0);


    grandTotal =
      Math.max(
        Number(
          grandTotal.toFixed(2)
        ),
        0
      );


    // -----------------------------
    // PAYMENT CALCULATION
    // -----------------------------

    let finalCashAmount = 0;
    let finalUpiAmount = 0;

    let paidAmount = 0;
    let creditAmount = 0;


    // CASH

    if (
      paymentMethod === "cash"
    ) {
      finalCashAmount =
        grandTotal;

      paidAmount =
        grandTotal;
    }


    // UPI

    if (
      paymentMethod === "upi"
    ) {
      finalUpiAmount =
        grandTotal;

      paidAmount =
        grandTotal;
    }


    // CREDIT

    if (
      paymentMethod === "credit"
    ) {
      finalCashAmount =
        Number(cashAmount || 0);

      finalUpiAmount =
        Number(upiAmount || 0);


      paidAmount =
        finalCashAmount +
        finalUpiAmount;


      if (
        paidAmount >
        grandTotal
      ) {
        await session.abortTransaction();

        return res.status(400).json({
          message:
            "Paid amount cannot be greater than bill total",
        });
      }


      creditAmount =
        grandTotal -
        paidAmount;
    }


    // SPLIT

    if (
      paymentMethod === "split"
    ) {
      finalCashAmount =
        Number(cashAmount || 0);

      finalUpiAmount =
        Number(upiAmount || 0);


      paidAmount =
        finalCashAmount +
        finalUpiAmount;


      if (
        paidAmount >
        grandTotal
      ) {
        await session.abortTransaction();

        return res.status(400).json({
          message:
            "Split payment exceeds bill total",
        });
      }


      creditAmount =
        grandTotal -
        paidAmount;
    }


    paidAmount =
      Number(
        paidAmount.toFixed(2)
      );


    creditAmount =
      Number(
        creditAmount.toFixed(2)
      );


    // -----------------------------
    // PAYMENT STATUS
    // -----------------------------

    let paymentStatus =
      "paid";


    if (
      creditAmount ===
      grandTotal &&
      grandTotal > 0
    ) {
      paymentStatus =
        "pending";
    }

    else if (
      creditAmount > 0
    ) {
      paymentStatus =
        "partial";
    }


    // -----------------------------
    // GET SETTINGS
    // -----------------------------

  

    const invoicePrefix =
      settings?.invoicePrefix ||
      "INV";


    // -----------------------------
    // GENERATE INVOICE NUMBER
    // -----------------------------

    const invoiceNumber =
      await generateInvoiceNumber(
        invoicePrefix,
        session
      );


    // -----------------------------
    // CREATE INVOICE
    // -----------------------------

    const [invoice] =
      await Invoice.create(
        [
          {
            invoiceNumber,

            customer:
              customer?._id ||
              null,

            customerName:
              customer?.name ||
              "Walk-in Customer",

            customerPhone:
              customer?.phone ||
              "",

            items:
              invoiceItems,

            subtotal:
              Number(
                subtotal.toFixed(2)
              ),

            discountAmount:
              Number(
                totalDiscount.toFixed(2)
              ),

            gstAmount:
              Number(
                totalGST.toFixed(2)
              ),

            roundOff:
              Number(
                roundOff || 0
              ),

            grandTotal,

            paymentMethod,

            paidAmount,

            creditAmount,

            paymentDetails: {
              cashAmount:
                finalCashAmount,

              upiAmount:
                finalUpiAmount,

              upiReference,
            },

            paymentStatus,

            dueDate:
              creditAmount > 0
                ? dueDate || null
                : null,

            notes:
              notes || "",

            createdBy:
              req.user._id,
          },
        ],
        {
          session,
        }
      );


    // -----------------------------
    // REDUCE PRODUCT STOCK
    // -----------------------------

    for (
      const item of validatedItems
    ) {
      item.product.stock -=
        item.quantity;


      await item.product.save({
        session,
      });
    }


    // -----------------------------
    // UPDATE CUSTOMER
    // -----------------------------

    if (customer) {
      customer.totalPurchases +=
        grandTotal;

      customer.totalPaid +=
        paidAmount;

      customer.creditBalance +=
        creditAmount;

      customer.lastPurchase =
        new Date();


      await customer.save({
        session,
      });
    }


    // -----------------------------
    // POPULATE FINAL INVOICE
    // -----------------------------

    const finalInvoice =
      await Invoice.findById(
        invoice._id
      )
        .session(session)

        .populate(
          "customer",
          "name phone address email gstin creditBalance"
        )

        .populate(
          "createdBy",
          "name username role"
        );


    // -----------------------------
    // COMMIT TRANSACTION
    // -----------------------------

    await session.commitTransaction();


    // -----------------------------
    // RESPONSE
    // -----------------------------

    res.status(201).json({
      message:
        "Invoice created successfully",

      invoice:
        finalInvoice,
    });
  }

  catch (error) {

    // Rollback only if transaction
    // is still active

    if (
      session.inTransaction()
    ) {
      await session.abortTransaction();
    }


    console.error(
      "CREATE INVOICE ERROR:",
      error
    );


    res.status(500).json({
      message:
        "Server error",

      error:
        error.message,
    });
  }

  finally {
    await session.endSession();
  }
};


// ==========================================
// GET ALL INVOICES / BILL HISTORY
// ==========================================

export const getInvoices = async (
  req,
  res
) => {
  try {
    const {
      search,
      paymentMethod,
      paymentStatus,
      startDate,
      endDate,
    } = req.query;


    const filter = {};


    // Payment method filter

    if (paymentMethod) {
      filter.paymentMethod =
        paymentMethod;
    }


    // Payment status filter

    if (paymentStatus) {
      filter.paymentStatus =
        paymentStatus;
    }


    // Date range filter

    if (
      startDate ||
      endDate
    ) {
      filter.invoiceDate = {};


      if (startDate) {
        filter.invoiceDate.$gte =
          new Date(startDate);
      }


      if (endDate) {
        const end =
          new Date(endDate);

        end.setHours(
          23,
          59,
          59,
          999
        );


        filter.invoiceDate.$lte =
          end;
      }
    }


    // Search invoice/customer/phone

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

        {
          customerPhone: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }


    const invoices =
      await Invoice.find(filter)

        .populate(
          "customer",
          "name phone address creditBalance"
        )

        .populate(
          "createdBy",
          "name username role"
        )

        .sort({
          invoiceDate: -1,
        });


    res.status(200).json({
      count:
        invoices.length,

      invoices,
    });
  }

  catch (error) {
    res.status(500).json({
      message:
        "Server error",

      error:
        error.message,
    });
  }
};


// ==========================================
// GET SINGLE INVOICE
// ==========================================

export const getInvoiceById = async (
  req,
  res
) => {
  try {
    const invoice =
      await Invoice.findById(
        req.params.id
      )

        .populate(
          "customer",
          "name phone address email gstin creditBalance"
        )

        .populate(
          "createdBy",
          "name username role"
        )

        .populate(
          "items.product",
          "name productCode category brand unit"
        );


    if (!invoice) {
      return res.status(404).json({
        message:
          "Invoice not found",
      });
    }


    res.status(200).json({
      invoice,
    });
  }

  catch (error) {
    res.status(500).json({
      message:
        "Server error",

      error:
        error.message,
    });
  }
};


// ==========================================
// GET INVOICE USING INVOICE NUMBER
// ==========================================

export const getInvoiceByNumber = async (
  req,
  res
) => {
  try {
    const invoice =
      await Invoice.findOne({
        invoiceNumber:
          req.params.invoiceNumber,
      })

        .populate(
          "customer",
          "name phone address email gstin creditBalance"
        )

        .populate(
          "createdBy",
          "name username role"
        )

        .populate(
          "items.product",
          "name productCode category brand unit"
        );


    if (!invoice) {
      return res.status(404).json({
        message:
          "Invoice not found",
      });
    }


    res.status(200).json({
      invoice,
    });
  }

  catch (error) {
    res.status(500).json({
      message:
        "Server error",

      error:
        error.message,
    });
  }
};