
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Search,
  SlidersHorizontal,
  ReceiptText,
  CalendarDays,
  ChevronRight,
  Printer,
  RefreshCw,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import "../styles/billhistory.css";
import OwnerBottomNav from "../components/OwnerBottomnav";

const API_URL = import.meta.env.VITE_API_URL;

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const formatDate = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getCustomerName = (invoice) =>
  invoice.customerName ||
  invoice.customer?.name ||
  "Walk-in Customer";

const BillHistory = () => {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // FETCH REAL INVOICES
  // ==========================================

  const fetchInvoices = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await axios.get(
        `${API_URL}/api/invoices`,
        {
          headers: {
            Authorization:
              `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = response.data;

      const invoiceList = Array.isArray(data)
        ? data
        : data.invoices || [];

      setInvoices(invoiceList);
    } catch (err) {
      console.error("BILL HISTORY ERROR:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load bill history."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // ==========================================
  // FILTERING
  // ==========================================

  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return invoices
      .filter((invoice) => {
        const customer = getCustomerName(invoice);

        const searchable = [
          invoice.invoiceNumber,
          customer,
          invoice.customerPhone,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !query || searchable.includes(query);

        const matchesStatus =
          statusFilter === "all" ||
          invoice.paymentStatus === statusFilter;

        const matchesMethod =
          methodFilter === "all" ||
          invoice.paymentMethod === methodFilter;

        const invoiceDate = invoice.invoiceDate
          ? new Date(invoice.invoiceDate)
          : new Date(invoice.createdAt);

        let matchesDate = true;

        if (dateFrom) {
          const from = new Date(`${dateFrom}T00:00:00`);

          if (invoiceDate < from) {
            matchesDate = false;
          }
        }

        if (dateTo) {
          const to = new Date(`${dateTo}T23:59:59.999`);

          if (invoiceDate > to) {
            matchesDate = false;
          }
        }

        return (
          matchesSearch &&
          matchesStatus &&
          matchesMethod &&
          matchesDate
        );
      })
      .sort(
        (a, b) =>
          new Date(b.invoiceDate || b.createdAt) -
          new Date(a.invoiceDate || a.createdAt)
      );
  }, [
    invoices,
    search,
    statusFilter,
    methodFilter,
    dateFrom,
    dateTo,
  ]);

  // ==========================================
  // SUMMARY
  // ==========================================

  const summary = useMemo(() => {
    const completed = filteredInvoices.filter(
      (invoice) => invoice.status === "completed"
    );

    return {
      totalBills: filteredInvoices.length,

      totalSales: completed.reduce(
        (sum, invoice) =>
          sum + Number(invoice.grandTotal || 0),
        0
      ),

      outstanding: completed.reduce(
        (sum, invoice) =>
          sum + Number(invoice.creditAmount || 0),
        0
      ),
    };
  }, [filteredInvoices]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setMethodFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const hasActiveFilters =
    Boolean(search.trim()) ||
    statusFilter !== "all" ||
    methodFilter !== "all" ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  // ==========================================
  // JSX
  // ==========================================

  return (
    <div className="billhistory-page">
      {/* HEADER */}
      <header className="billhistory-header">
        <div className="billhistory-header-info">
          <h1>Bill history</h1>
          <p>View and manage previous invoices</p>
        </div>

        <button
          type="button"
          className="billhistory-refresh-button"
          onClick={() => fetchInvoices(true)}
          disabled={refreshing}
          aria-label="Refresh invoices"
        >
          <RefreshCw size={22} />
        </button>
      </header>

      {/* SUMMARY */}
      <section className="billhistory-summary">
        <div className="billhistory-summary-card">
          <span>Total bills</span>
          <strong>{summary.totalBills}</strong>
        </div>

        <div className="billhistory-summary-card">
          <span>Sales value</span>
          <strong>
            {formatCurrency(summary.totalSales)}
          </strong>
        </div>

        <div className="billhistory-summary-card">
          <span>Outstanding</span>
          <strong>
            {formatCurrency(summary.outstanding)}
          </strong>
        </div>
      </section>

      {/* SEARCH */}
      <section className="billhistory-search-section">
        <div className="billhistory-search-box">
          <Search size={21} />

          <input
            type="text"
            placeholder="Search invoice, customer or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="billhistory-search-input"
          />

          <button
            type="button"
            className="billhistory-filter-trigger"
            onClick={() => setShowFilters((prev) => !prev)}
            aria-label="Toggle bill filters"
          >
            <SlidersHorizontal size={21} />
          </button>
        </div>
      </section>

      {/* FILTER PANEL */}
      {showFilters && (
        <section className="billhistory-filter-panel">
          <div className="billhistory-filter-heading">
            <h2>Filters</h2>

            <button
              type="button"
              onClick={() => setShowFilters(false)}
              aria-label="Close filters"
            >
              <X size={20} />
            </button>
          </div>

          <div className="billhistory-filter-field">
            <label>Payment status</label>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
            >
              <option value="all">All statuses</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="billhistory-filter-field">
            <label>Payment method</label>

            <select
              value={methodFilter}
              onChange={(e) =>
                setMethodFilter(e.target.value)
              }
            >
              <option value="all">All methods</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="credit">Credit</option>
              <option value="split">Split</option>
            </select>
          </div>

          <div className="billhistory-date-row">
            <div className="billhistory-filter-field">
              <label>
                <CalendarDays size={16} />
                From date
              </label>

              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="billhistory-filter-field">
              <label>
                <CalendarDays size={16} />
                To date
              </label>

              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className="billhistory-clear-filters"
              onClick={resetFilters}
            >
              Clear filters
            </button>
          )}
        </section>
      )}

      {/* BILL LIST HEADING */}
      <section className="billhistory-list-heading">
        <h2>Invoices</h2>

        <span>
          {filteredInvoices.length}{" "}
          {filteredInvoices.length === 1
            ? "bill"
            : "bills"}
        </span>
      </section>

      {error && (
        <div className="billhistory-error-message">
          {error}
        </div>
      )}

      {/* BILL LIST */}
      <section className="billhistory-list">
        {loading ? (
          <div className="billhistory-loading">
            Loading invoices...
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="billhistory-empty">
            <ReceiptText size={38} />

            <h3>No invoices found</h3>

            <p>
              {hasActiveFilters
                ? "Try changing your search or filters."
                : "Generated invoices will appear here."}
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          filteredInvoices.map((invoice) => {
            const paymentStatus =
              invoice.paymentStatus || "pending";

            return (
              <article
                className="billhistory-invoice-card"
                key={invoice._id}
              >
                <div className="billhistory-invoice-top">
                  <div className="billhistory-invoice-icon">
                    <ReceiptText size={23} />
                  </div>

                  <div className="billhistory-invoice-info">
                    <strong className="billhistory-invoice-number">
                      {invoice.invoiceNumber}
                    </strong>

                    <span className="billhistory-invoice-date">
                      {formatDate(
                        invoice.invoiceDate || invoice.createdAt
                      )}
                    </span>
                  </div>

                  <span
                    className={`billhistory-status billhistory-status-${paymentStatus}`}
                  >
                    {paymentStatus.toUpperCase()}
                  </span>
                </div>

                <div className="billhistory-invoice-middle">
                  <div className="billhistory-customer-info">
                    <span>Customer</span>
                    <strong>{getCustomerName(invoice)}</strong>
                  </div>

                  <div className="billhistory-amount-info">
                    <span>Bill amount</span>
                    <strong>
                      {formatCurrency(invoice.grandTotal)}
                    </strong>
                  </div>
                </div>

                <div className="billhistory-invoice-meta">
                  <span>
                    {invoice.paymentMethod?.toUpperCase()}
                  </span>

                  {Number(invoice.creditAmount || 0) > 0 && (
                    <span className="billhistory-credit-amount">
                      Due:{" "}
                      {formatCurrency(invoice.creditAmount)}
                    </span>
                  )}
                </div>

                <div className="billhistory-invoice-actions">
                  <button
                    type="button"
                    className="billhistory-view-button"
                    onClick={() =>
                      navigate(`/bills/${invoice._id}`)
                    }
                  >
                    View invoice
                    <ChevronRight size={18} />
                  </button>

                  <button
                    type="button"
                    className="billhistory-print-button"
                    onClick={() =>
                      navigate(`/bills/${invoice._id}`, {
                        state: { printRequested: true },
                      })
                    }
                  >
                    <Printer size={18} />
                    Reprint
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>

      <OwnerBottomNav />
    </div>
  );
};

export default BillHistory;
