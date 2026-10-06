import Customer from "../models/Customer.model.js";
import Invoice from "../models/Invoice.model.js";
import Product from "../models/Product.model.js";


// GET OWNER DASHBOARD
export const getDashboard = async (req, res) => {
  try {
    // -----------------------------------
    // TODAY START / END
    // -----------------------------------

    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const todayFilter = {
      invoiceDate: {
        $gte: startOfToday,
        $lte: endOfToday,
      },
      status: "completed",
    };

    // -----------------------------------
    // TODAY'S INVOICES
    // -----------------------------------

    const todayInvoices = await Invoice.find(todayFilter);

    let todaySales = 0;
    let cashSales = 0;
    let upiSales = 0;
    let creditSales = 0;

    for (const invoice of todayInvoices) {
      todaySales += invoice.grandTotal;

      cashSales +=
        invoice.paymentDetails?.cashAmount || 0;

      upiSales +=
        invoice.paymentDetails?.upiAmount || 0;

      creditSales += invoice.creditAmount || 0;
    }

    // -----------------------------------
    // TOTAL BILLS TODAY
    // -----------------------------------

    const billsToday = todayInvoices.length;

    // -----------------------------------
    // PRODUCT STATISTICS
    // -----------------------------------

    const totalProducts = await Product.countDocuments({
      isActive: true,
    });

    const products = await Product.find({
      isActive: true,
    });

    const lowStockProducts = products.filter(
      (product) =>
        product.stock > 0 &&
        product.stock <= product.minimumStock
    );

    const outOfStockProducts = products.filter(
      (product) => product.stock === 0
    );

    // -----------------------------------
    // TOTAL OUTSTANDING CUSTOMER CREDIT
    // -----------------------------------

    const creditResult = await Customer.aggregate([
      {
        $match: {
          isActive: true,
        },
      },
      {
        $group: {
          _id: null,
          totalOutstanding: {
            $sum: "$creditBalance",
          },
        },
      },
    ]);

    const outstandingCredit =
      creditResult.length > 0
        ? creditResult[0].totalOutstanding
        : 0;

    // -----------------------------------
    // CREDIT CUSTOMERS COUNT
    // -----------------------------------

    const creditCustomers =
      await Customer.countDocuments({
        isActive: true,
        creditBalance: {
          $gt: 0,
        },
      });

    // -----------------------------------
    // RECENT INVOICES
    // -----------------------------------

    const recentInvoices = await Invoice.find({
      status: "completed",
    })
      .populate(
        "customer",
        "name phone"
      )
      .populate(
        "createdBy",
        "name username role"
      )
      .sort({
        invoiceDate: -1,
      })
      .limit(5);

    // -----------------------------------
    // TOP LOW STOCK PRODUCTS
    // -----------------------------------

    const lowStock = await Product.find({
      isActive: true,

      $expr: {
        $lte: [
          "$stock",
          "$minimumStock",
        ],
      },
    })
      .select(
        "name productCode category brand stock minimumStock unit"
      )
      .sort({
        stock: 1,
      })
      .limit(10);

    // -----------------------------------
    // TODAY'S PROFIT ESTIMATE
    // -----------------------------------

  let estimatedProfit = 0;

for (const invoice of todayInvoices) {
  for (const item of invoice.items) {
    const purchaseTotal =
      (item.purchasePrice || 0) *
      item.quantity;

    const sellingBeforeGST =
      item.taxableAmount;

    estimatedProfit +=
      sellingBeforeGST -
      purchaseTotal;
  }
}

estimatedProfit = Number(
  estimatedProfit.toFixed(2)
);

    // -----------------------------------
    // ROUND VALUES
    // -----------------------------------

    const round = (value) =>
      Number(Number(value || 0).toFixed(2));

    // -----------------------------------
    // RESPONSE
    // -----------------------------------

    res.status(200).json({
      summary: {
        todaySales: round(todaySales),

        billsToday,

        cashSales: round(cashSales),

        upiSales: round(upiSales),

        creditSales: round(creditSales),

        outstandingCredit:
          round(outstandingCredit),

        creditCustomers,

        totalProducts,

        lowStockCount:
          lowStockProducts.length,

        outOfStockCount:
          outOfStockProducts.length,

        estimatedProfit:
          round(estimatedProfit),
      },

      lowStockProducts: lowStock,

      recentInvoices,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};