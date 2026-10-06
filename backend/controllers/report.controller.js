import Invoice from "../models/Invoice.model.js";
import Return from "../models/Return.model.js";

// SALES REPORT
export const getSalesReport = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
    } = req.query;

    // -----------------------------------
    // DATE FILTER
    // -----------------------------------

    const invoiceFilter = {
      status: {
        $in: ["completed", "returned"],
      },
    };

    const returnFilter = {};

    if (startDate || endDate) {
      invoiceFilter.invoiceDate = {};
      returnFilter.returnDate = {};

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        invoiceFilter.invoiceDate.$gte = start;
        returnFilter.returnDate.$gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        invoiceFilter.invoiceDate.$lte = end;
        returnFilter.returnDate.$lte = end;
      }
    }

    // -----------------------------------
    // GET INVOICES
    // -----------------------------------

    const invoices = await Invoice.find(
      invoiceFilter
    );

    // -----------------------------------
    // SALES CALCULATIONS
    // -----------------------------------

    let grossSales = 0;
    let gstCollected = 0;

    let cashSales = 0;
    let upiSales = 0;
    let creditSales = 0;

    let totalDiscount = 0;

    for (const invoice of invoices) {
      grossSales +=
        Number(invoice.grandTotal || 0);

      gstCollected +=
        Number(invoice.gstAmount || 0);

      totalDiscount +=
        Number(invoice.discountAmount || 0);

      cashSales +=
        Number(
          invoice.paymentDetails?.cashAmount || 0
        );

      upiSales +=
        Number(
          invoice.paymentDetails?.upiAmount || 0
        );

      creditSales +=
        Number(invoice.creditAmount || 0);
    }

    // -----------------------------------
    // RETURNS
    // -----------------------------------

    const returns = await Return.find(
      returnFilter
    );

    let totalReturns = 0;

    for (const returnData of returns) {
      totalReturns += Number(
        returnData.totalRefundAmount || 0
      );
    }

    // -----------------------------------
    // NET SALES
    // -----------------------------------

    const netSales =
      grossSales - totalReturns;

    // -----------------------------------
    // BILL COUNT
    // -----------------------------------

    const totalBills = invoices.length;

    // -----------------------------------
    // AVERAGE BILL VALUE
    // -----------------------------------

    const averageBillValue =
      totalBills > 0
        ? grossSales / totalBills
        : 0;

    // -----------------------------------
    // PAYMENT METHOD COUNTS
    // -----------------------------------

    const paymentCounts = {
      cash: 0,
      upi: 0,
      credit: 0,
      split: 0,
    };

    for (const invoice of invoices) {
      if (
        paymentCounts[
          invoice.paymentMethod
        ] !== undefined
      ) {
        paymentCounts[
          invoice.paymentMethod
        ]++;
      }
    }

    // -----------------------------------
    // ROUND HELPER
    // -----------------------------------

    const round = (value) =>
      Number(
        Number(value || 0).toFixed(2)
      );

    // -----------------------------------
    // RESPONSE
    // -----------------------------------

    res.status(200).json({
      period: {
        startDate:
          startDate || "All time",

        endDate:
          endDate || "All time",
      },

      summary: {
        grossSales:
          round(grossSales),

        returns:
          round(totalReturns),

        netSales:
          round(netSales),

        totalBills,

        averageBillValue:
          round(averageBillValue),

        gstCollected:
          round(gstCollected),

        totalDiscount:
          round(totalDiscount),
      },

      paymentBreakdown: {
        cash:
          round(cashSales),

        upi:
          round(upiSales),

        outstandingCredit:
          round(creditSales),
      },

      paymentCounts,
    });
  } catch (error) {
    console.error(
      "SALES REPORT ERROR:",
      error
    );

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
// PRODUCT / TOP-SELLING REPORT
export const getProductSalesReport = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      limit = 10,
    } = req.query;

    // -----------------------------------
    // DATE FILTER
    // -----------------------------------

    const invoiceMatch = {
      status: {
        $in: ["completed", "returned"],
      },
    };

    const returnMatch = {};

    if (startDate || endDate) {
      invoiceMatch.invoiceDate = {};
      returnMatch.returnDate = {};

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        invoiceMatch.invoiceDate.$gte = start;
        returnMatch.returnDate.$gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        invoiceMatch.invoiceDate.$lte = end;
        returnMatch.returnDate.$lte = end;
      }
    }

    // -----------------------------------
    // SALES BY PRODUCT
    // -----------------------------------

    const sales = await Invoice.aggregate([
      {
        $match: invoiceMatch,
      },

      {
        $unwind: "$items",
      },

      {
        $group: {
          _id: "$items.product",

          productName: {
            $first: "$items.productName",
          },

          productCode: {
            $first: "$items.productCode",
          },

          unit: {
            $first: "$items.unit",
          },

          quantitySold: {
            $sum: "$items.quantity",
          },

          grossRevenue: {
            $sum: "$items.total",
          },

          gstAmount: {
            $sum: "$items.gstAmount",
          },

          billCount: {
            $sum: 1,
          },
        },
      },
    ]);

    // -----------------------------------
    // RETURNS BY PRODUCT
    // -----------------------------------

    const returns = await Return.aggregate([
      {
        $match: returnMatch,
      },

      {
        $unwind: "$items",
      },

      {
        $group: {
          _id: "$items.product",

          quantityReturned: {
            $sum: "$items.quantity",
          },

          refundAmount: {
            $sum: "$items.refundAmount",
          },
        },
      },
    ]);

    // -----------------------------------
    // CREATE RETURN LOOKUP MAP
    // -----------------------------------

    const returnMap = {};

    for (const item of returns) {
      returnMap[item._id.toString()] = {
        quantityReturned:
          item.quantityReturned || 0,

        refundAmount:
          item.refundAmount || 0,
      };
    }

    // -----------------------------------
    // COMBINE SALES + RETURNS
    // -----------------------------------

    const productReport = sales.map((sale) => {
      const productId =
        sale._id.toString();

      const returnData =
        returnMap[productId] || {
          quantityReturned: 0,
          refundAmount: 0,
        };

      const netQuantitySold =
        sale.quantitySold -
        returnData.quantityReturned;

      const netRevenue =
        sale.grossRevenue -
        returnData.refundAmount;

      return {
        productId: sale._id,

        productName:
          sale.productName,

        productCode:
          sale.productCode,

        unit:
          sale.unit,

        quantitySold:
          Number(
            sale.quantitySold.toFixed(2)
          ),

        quantityReturned:
          Number(
            returnData.quantityReturned.toFixed(2)
          ),

        netQuantitySold:
          Number(
            netQuantitySold.toFixed(2)
          ),

        grossRevenue:
          Number(
            sale.grossRevenue.toFixed(2)
          ),

        refundAmount:
          Number(
            returnData.refundAmount.toFixed(2)
          ),

        netRevenue:
          Number(
            netRevenue.toFixed(2)
          ),

        gstAmount:
          Number(
            sale.gstAmount.toFixed(2)
          ),

        billCount:
          sale.billCount,
      };
    });

    // -----------------------------------
    // TOP SELLING
    // -----------------------------------

    productReport.sort(
      (a, b) =>
        b.netQuantitySold -
        a.netQuantitySold
    );

    const topSellingProducts =
      productReport.slice(
        0,
        Math.max(
          1,
          Number(limit) || 10
        )
      );

    // -----------------------------------
    // RESPONSE
    // -----------------------------------

    res.status(200).json({
      period: {
        startDate:
          startDate || "All time",

        endDate:
          endDate || "All time",
      },

      totalProductsSold:
        productReport.length,

      topSellingProducts,
    });
  } catch (error) {
    console.error(
      "PRODUCT REPORT ERROR:",
      error
    );

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};