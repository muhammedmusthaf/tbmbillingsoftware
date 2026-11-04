
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  ReceiptText,
  Wallet,
  AlertTriangle,
  Package,
  Download,
  RefreshCw,
  CalendarDays,
  IndianRupee,
  CreditCard,
  Banknote,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import "../styles/reports.css";
import OwnerBottomNav from "../components/OwnerBottomnav";

const API_URL = import.meta.env.VITE_API_URL;

const money = (value = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const localDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getInvoiceDate = (invoice) =>
  invoice.invoiceDate || invoice.createdAt;

const getInvoiceCustomer = (invoice) =>
  invoice.customerName ||
  invoice.customer?.name ||
  "Walk-in Customer";

const getArray = (response, key) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.[key])) return response[key];
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.[key])) {
    return response.data[key];
  }
  return null;
};

const Reports = () => {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [salesReport, setSalesReport] = useState(null);
  const [productReport, setProductReport] = useState(null);

  const [range, setRange] = useState("7days");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [reportWarning, setReportWarning] = useState("");

  const config = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  // ==========================================
  // LOAD ACTUAL BACKEND DATA
  // ==========================================

  const fetchReports = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      setError("");
      setReportWarning("");

      const results = await Promise.allSettled([
        axios.get(`${API_URL}/api/invoices`, config()),
        axios.get(`${API_URL}/api/products`, config()),
        axios.get(`${API_URL}/api/reports/sales`, config()),
        axios.get(`${API_URL}/api/reports/products`, config()),
      ]);

      const [
        invoiceResult,
        productResult,
        salesResult,
        productReportResult,
      ] = results;

      if (invoiceResult.status === "fulfilled") {
        const list = getArray(
          invoiceResult.value.data,
          "invoices"
        );

        if (!list) {
          setInvoices([]);
          setError(
            "Invoice response format is not supported. Check the API response."
          );
        } else {
          setInvoices(list);
        }
      } else {
        setInvoices([]);
        setError(
          invoiceResult.reason?.response?.data?.message ||
            "Unable to load invoices."
        );
      }

      if (productResult.status === "fulfilled") {
        const list = getArray(
          productResult.value.data,
          "products"
        );

        setProducts(list || []);
      } else {
        setProducts([]);
      }

      if (salesResult.status === "fulfilled") {
        setSalesReport(salesResult.value.data);
      } else {
        setSalesReport(null);
      }

      if (productReportResult.status === "fulfilled") {
        setProductReport(productReportResult.value.data);
      } else {
        setProductReport(null);
      }

      if (
        salesResult.status === "rejected" ||
        productReportResult.status === "rejected"
      ) {
        setReportWarning(
          "One or more report endpoints are unavailable. Invoice-based analytics are shown where possible."
        );
      }
    } catch (err) {
      console.error("REPORTS ERROR:", err);
      setError("Unable to load analytics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // ==========================================
  // DATE RANGE
  // ==========================================

  const dates = useMemo(() => {
    const today = new Date();
    const end = localDate(today);
    const start = new Date(today);

    if (range === "today") {
      return { start: end, end };
    }

    if (range === "7days") {
      start.setDate(start.getDate() - 6);
      return { start: localDate(start), end };
    }

    if (range === "30days") {
      start.setDate(start.getDate() - 29);
      return { start: localDate(start), end };
    }

    if (range === "month") {
      start.setDate(1);
      return { start: localDate(start), end };
    }

    return {
      start: fromDate || "",
      end: toDate || "",
    };
  }, [range, fromDate, toDate]);

  // ==========================================
  // FILTER INVOICES
  // ==========================================

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const rawDate = getInvoiceDate(invoice);
      if (!rawDate) return false;

      const date = new Date(rawDate);
      if (Number.isNaN(date.getTime())) return false;

      const key = localDate(date);

      if (dates.start && key < dates.start) return false;
      if (dates.end && key > dates.end) return false;

      return true;
    });
  }, [invoices, dates]);

  const completedInvoices = useMemo(
    () =>
      filteredInvoices.filter(
        (invoice) => invoice.status === "completed"
      ),
    [filteredInvoices]
  );

  // ==========================================
  // SALES SUMMARY
  // ==========================================

  const summary = useMemo(() => {
    const revenue = completedInvoices.reduce(
      (sum, invoice) =>
        sum + Number(invoice.grandTotal || 0),
      0
    );

    const collected = completedInvoices.reduce(
      (sum, invoice) =>
        sum + Number(invoice.paidAmount || 0),
      0
    );

    const outstanding = completedInvoices.reduce(
      (sum, invoice) =>
        sum + Number(invoice.creditAmount || 0),
      0
    );

    return {
      revenue,
      collected,
      outstanding,
      invoiceCount: completedInvoices.length,
    };
  }, [completedInvoices]);

  // ==========================================
  // SALES TREND
  // ==========================================

  const salesTrend = useMemo(() => {
    const grouped = {};

    completedInvoices.forEach((invoice) => {
      const date = new Date(getInvoiceDate(invoice));
      const key = localDate(date);

      grouped[key] =
        (grouped[key] || 0) +
        Number(invoice.grandTotal || 0);
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({ date, total }));
  }, [completedInvoices]);

  const maxSales = Math.max(
    1,
    ...salesTrend.map((item) => item.total)
  );

  // ==========================================
  // TOP SELLING PRODUCTS
  // ==========================================

  const topProducts = useMemo(() => {
    const grouped = new Map();

    completedInvoices.forEach((invoice) => {
      (invoice.items || []).forEach((item) => {
        const key =
          item.productCode ||
          item.product?._id ||
          item.product ||
          item.productName;

        if (!key) return;

        const quantity = Number(item.quantity || 0);
        const total = Number(item.total || 0);

        const existing = grouped.get(String(key)) || {
          name: item.productName || "Unnamed product",
          quantity: 0,
          revenue: 0,
          unit: item.unit || "",
        };

        existing.quantity += quantity;
        existing.revenue += total;

        grouped.set(String(key), existing);
      });
    });

    return [...grouped.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [completedInvoices]);

  const maxProductRevenue = Math.max(
    1,
    ...topProducts.map((item) => item.revenue)
  );

  // ==========================================
  // PAYMENT METHODS
  // ==========================================

  const paymentMethods = useMemo(() => {
    const counts = {
      cash: 0,
      upi: 0,
      credit: 0,
      split: 0,
    };

    completedInvoices.forEach((invoice) => {
      const method = invoice.paymentMethod;

      if (Object.prototype.hasOwnProperty.call(counts, method)) {
        counts[method] += 1;
      }
    });

    return Object.entries(counts).map(([method, count]) => ({
      method,
      count,
    }));
  }, [completedInvoices]);

  // ==========================================
  // INVENTORY SUMMARY
  // ==========================================

  const inventorySummary = useMemo(() => {
    const activeProducts = products.filter(
      (product) => product.isActive !== false
    );

    const outOfStock = activeProducts.filter(
      (product) => Number(product.stock || 0) <= 0
    );

    const lowStock = activeProducts.filter((product) => {
      const stock = Number(product.stock || 0);
      const minimum = Number(product.minimumStock || 0);

      return stock > 0 && stock <= minimum;
    });

    return {
      total: activeProducts.length,
      lowStock: lowStock.length,
      outOfStock: outOfStock.length,
    };
  }, [products]);

  // ==========================================
  // CSV EXPORT
  // ==========================================

  const exportCSV = () => {
    const headers = [
      "Invoice Number",
      "Date",
      "Customer",
      "Payment Method",
      "Payment Status",
      "Grand Total",
      "Paid Amount",
      "Credit Amount",
    ];

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = completedInvoices.map((invoice) => [
      invoice.invoiceNumber,
      getInvoiceDate(invoice),
      getInvoiceCustomer(invoice),
      invoice.paymentMethod,
      invoice.paymentStatus,
      invoice.grandTotal,
      invoice.paidAmount,
      invoice.creditAmount,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `sales-report-${localDate(new Date())}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  // ==========================================
  // JSX
  // ==========================================

  return (
    <div className="reports-page">

      {/* HEADER */}
      <header className="reports-header">
        <button
          type="button"
          className="reports-back-button"
          onClick={() => navigate("/more")}
          aria-label="Go back"
        >
          <ArrowLeft size={23} />
        </button>

        <div className="reports-header-info">
          <h1>Reports & Analytics</h1>
          <p>Business performance overview</p>
        </div>

        <button
          type="button"
          className="reports-refresh-button"
          onClick={() => fetchReports(true)}
          disabled={refreshing}
          aria-label="Refresh reports"
        >
          <RefreshCw size={21} />
        </button>
      </header>

      {/* DATE FILTER */}
      <section className="reports-date-section">
        <div className="reports-section-label">
          <CalendarDays size={19} />
          <span>Report period</span>
        </div>

        <div className="reports-date-tabs">
          {[
            ["today", "Today"],
            ["7days", "7 Days"],
            ["30days", "30 Days"],
            ["month", "This Month"],
            ["custom", "Custom"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`reports-date-tab ${
                range === value
                  ? "reports-date-tab-active"
                  : ""
              }`}
              onClick={() => setRange(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {range === "custom" && (
          <div className="reports-custom-date">
            <label>
              From
              <input
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </label>

            <label>
              To
              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(e) => setToDate(e.target.value)}
              />
            </label>
          </div>
        )}
      </section>

      {error && (
        <div className="reports-error-message">
          {error}
        </div>
      )}

      {reportWarning && (
        <div className="reports-warning-message">
          {reportWarning}
        </div>
      )}

      {loading ? (
        <div className="reports-loading">
          Loading analytics...
        </div>
      ) : (
        <>
          {/* SALES SUMMARY */}
          <section className="reports-summary-section">
            <div className="reports-section-heading">
              <h2>Sales overview</h2>
              <span>
                {dates.start || "All"} to {dates.end || "Today"}
              </span>
            </div>

            <div className="reports-summary-grid">

              <div className="reports-summary-card reports-revenue-card">
                <div className="reports-card-top">
                  <span>Total sales</span>
                  <TrendingUp size={22} />
                </div>

                <strong>
                  {money(summary.revenue)}
                </strong>

                <small>Completed invoice value</small>
              </div>

              <div className="reports-summary-card">
                <div className="reports-card-top">
                  <span>Total bills</span>
                  <ReceiptText size={22} />
                </div>

                <strong>{summary.invoiceCount}</strong>
                <small>Completed invoices</small>
              </div>

              <div className="reports-summary-card">
                <div className="reports-card-top">
                  <span>Invoice payments</span>
                  <IndianRupee size={22} />
                </div>

                <strong>
                  {money(summary.collected)}
                </strong>

                <small>Paid amounts on selected invoices</small>
              </div>

              <div className="reports-summary-card">
                <div className="reports-card-top">
                  <span>Outstanding</span>
                  <Wallet size={22} />
                </div>

                <strong>
                  {money(summary.outstanding)}
                </strong>

                <small>Remaining on selected invoices</small>
              </div>
            </div>
          </section>

          {/* SALES CHART */}
          <section className="reports-chart-section">
            <div className="reports-section-heading">
              <div>
                <h2>Sales trend</h2>
                <p>Daily completed invoice totals</p>
              </div>

              <BarChart3 size={23} />
            </div>

            {salesTrend.length === 0 ? (
              <div className="reports-empty-chart">
                No sales found for this period.
              </div>
            ) : (
              <div className="reports-chart-scroll">
                <div className="reports-chart-bars">
                  {salesTrend.map((item) => (
                    <div
                      className="reports-chart-column"
                      key={item.date}
                    >
                      <span className="reports-chart-value">
                        {money(item.total)}
                      </span>

                      <div className="reports-chart-track">
                        <div
                          className="reports-chart-bar"
                          style={{
                            height: `${
                              (item.total / maxSales) * 100
                            }%`,
                          }}
                        />
                      </div>

                      <span className="reports-chart-date">
                        {new Date(
                          `${item.date}T12:00:00`
                        ).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* TOP PRODUCTS */}
          <section className="reports-products-section">
            <div className="reports-section-heading">
              <div>
                <h2>Top selling products</h2>
                <p>Ranked by invoice item sales value</p>
              </div>

              <Package size={22} />
            </div>

            {topProducts.length === 0 ? (
              <div className="reports-empty-products">
                No product sales available.
              </div>
            ) : (
              <div className="reports-product-list">
                {topProducts.map((product, index) => (
                  <div
                    className="reports-product-card"
                    key={`${product.name}-${index}`}
                  >
                    <div className="reports-product-top">
                      <div className="reports-product-name">
                        <span className="reports-product-rank">
                          {index + 1}
                        </span>

                        <div>
                          <strong>{product.name}</strong>

                          <small>
                            {product.quantity} {product.unit} sold
                          </small>
                        </div>
                      </div>

                      <strong>
                        {money(product.revenue)}
                      </strong>
                    </div>

                    <div className="reports-product-progress">
                      <div
                        className="reports-product-progress-fill"
                        style={{
                          width: `${
                            (product.revenue /
                              maxProductRevenue) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* PAYMENT METHODS */}
          <section className="reports-payment-section">
            <div className="reports-section-heading">
              <h2>Payment methods</h2>
              <CreditCard size={22} />
            </div>

            <div className="reports-payment-list">
              {paymentMethods.map((item) => (
                <div
                  className="reports-payment-row"
                  key={item.method}
                >
                  <div className="reports-payment-label">
                    {item.method === "cash" ? (
                      <Banknote size={20} />
                    ) : (
                      <CreditCard size={20} />
                    )}

                    <span>
                      {item.method.toUpperCase()}
                    </span>
                  </div>

                  <strong>{item.count} bills</strong>
                </div>
              ))}
            </div>

            <p className="reports-payment-note">
              Counts represent invoice payment methods,
              not individual credit repayments.
            </p>
          </section>

          {/* INVENTORY */}
          <section className="reports-inventory-section">
            <div className="reports-section-heading">
              <h2>Inventory overview</h2>

              <button
                type="button"
                onClick={() => navigate("/inventory")}
                className="reports-inventory-link"
              >
                View stock
              </button>
            </div>

            <div className="reports-inventory-grid">
              <div className="reports-inventory-card">
                <Package size={23} />
                <strong>{inventorySummary.total}</strong>
                <span>Active products</span>
              </div>

              <div className="reports-inventory-card reports-inventory-low">
                <AlertTriangle size={23} />
                <strong>
                  {inventorySummary.lowStock}
                </strong>
                <span>Low stock</span>
              </div>

              <div className="reports-inventory-card reports-inventory-out">
                <AlertTriangle size={23} />
                <strong>
                  {inventorySummary.outOfStock}
                </strong>
                <span>Out of stock</span>
              </div>
            </div>
          </section>

          {/* EXPORT */}
          <section className="reports-export-section">
            <button
              type="button"
              className="reports-export-button"
              onClick={exportCSV}
              disabled={Boolean(error)}
            >
              <Download size={21} />
              Export sales report (CSV)
            </button>
          </section>
        </>
      )}

      <OwnerBottomNav />
    </div>
  );
};

export default Reports;
