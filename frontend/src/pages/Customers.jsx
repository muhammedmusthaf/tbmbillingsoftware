
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Search,
  SlidersHorizontal,
  ChevronRight,
  UsersRound,
  BellRing,
  Send,
  ChartNoAxesCombined,
  Phone,
  MapPin,
  X,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import "../styles/customer.css";
import OwnerBottomNav from "../components/OwnerBottomnav";

const API_URL = import.meta.env.VITE_API_URL;

const Customers = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reminderError, setReminderError] = useState("");

  const formatCurrency = (value = 0) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);

  const getBalance = (customer) =>
    Math.max(0, Number(customer.creditBalance) || 0);

  const isInvoiceOverdue = (invoice) => {
    if (
      !invoice.dueDate ||
      Number(invoice.creditAmount || 0) <= 0 ||
      invoice.status !== "completed"
    ) {
      return false;
    }

    const due = new Date(invoice.dueDate);
    const today = new Date();

    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return due < today;
  };

  useEffect(() => {
    let active = true;

    const loadCustomers = async () => {
      try {
        setLoading(true);
        setError("");

        const config = {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        };

        const customerResponse = await axios.get(
          `${API_URL}/api/customers`,
          config
        );

        if (!active) return;

        const customerData = customerResponse.data;
        setCustomers(
          Array.isArray(customerData)
            ? customerData
            : customerData.customers || []
        );

        // Invoice lookup is optional for overdue status.
        // Customer balances remain available if this request fails.
        try {
          const invoiceResponse = await axios.get(
            `${API_URL}/api/invoices`,
            config
          );

          if (active) {
            const invoiceData = invoiceResponse.data;
            setInvoices(
              Array.isArray(invoiceData)
                ? invoiceData
                : invoiceData.invoices || []
            );
          }
        } catch (invoiceError) {
          console.error("INVOICE LOOKUP ERROR:", invoiceError);
        }
      } catch (err) {
        console.error("CUSTOMERS LOAD ERROR:", err);

        if (active) {
          setError(
            err.response?.data?.message ||
              "Unable to load customers."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadCustomers();

    return () => {
      active = false;
    };
  }, []);

  const overdueCustomerIds = useMemo(() => {
    const ids = new Set();

    invoices.forEach((invoice) => {
      if (!isInvoiceOverdue(invoice)) return;

      const customerId =
        typeof invoice.customer === "object"
          ? invoice.customer?._id
          : invoice.customer;

      if (customerId) {
        ids.add(String(customerId));
      }
    });

    return ids;
  }, [invoices]);

  const getCreditStatus = (customer) => {
    if (getBalance(customer) <= 0) return "clear";

    if (overdueCustomerIds.has(String(customer._id))) {
      return "overdue";
    }

    return "pending";
  };

  const summary = useMemo(() => {
    const creditCustomers = customers.filter(
      (customer) => getBalance(customer) > 0
    );

    return {
      totalOutstanding: creditCustomers.reduce(
        (sum, customer) => sum + getBalance(customer),
        0
      ),
      openCount: creditCustomers.length,
      overdueCount: creditCustomers.filter((customer) =>
        overdueCustomerIds.has(String(customer._id))
      ).length,
      totalCustomers: customers.length,
    };
  }, [customers, overdueCustomerIds]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers
      .filter((customer) => {
        const searchable = [
          customer.name,
          customer.phone,
          customer.address,
          customer.email,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !query || searchable.includes(query);

        const status = getCreditStatus(customer);

        const matchesFilter =
          filter === "all" ||
          (filter === "open" && getBalance(customer) > 0) ||
          (filter === "overdue" && status === "overdue") ||
          (filter === "clear" && status === "clear");

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => getBalance(b) - getBalance(a));
  }, [customers, search, filter, overdueCustomerIds]);

  const reminderCustomer = useMemo(() => {
    const unpaid = customers
      .filter((customer) => getBalance(customer) > 0)
      .sort((a, b) => {
        const aOverdue = overdueCustomerIds.has(String(a._id)) ? 1 : 0;
        const bOverdue = overdueCustomerIds.has(String(b._id)) ? 1 : 0;

        return (
          bOverdue - aOverdue ||
          getBalance(b) - getBalance(a)
        );
      });

    return unpaid[0] || null;
  }, [customers, overdueCustomerIds]);

  const sendReminder = (customer) => {
    setReminderError("");

    if (!customer) return;

    let phone = String(customer.phone || "").replace(/\D/g, "");

    if (phone.length === 10) {
      phone = `91${phone}`;
    }

    if (!/^\d{11,15}$/.test(phone)) {
      setReminderError(
        `Please check the phone number for ${customer.name}.`
      );
      return;
    }

    const message =
      `Hello ${customer.name}, this is a payment reminder ` +
      `for your outstanding balance of ` +
      `${formatCurrency(getBalance(customer))}. ` +
      `Please contact the shop regarding payment. Thank you.`;

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const statusLabel = {
    pending: "PENDING",
    overdue: "OVERDUE",
    clear: "PAID",
  };

  if (loading) {
    return (
      <div className="customers-loading">
        Loading customers...
      </div>
    );
  }

  return (
    <div className="customers-page">
      <header className="customers-header">
        <h1 className="customers-title">
          Customers &amp; credit
        </h1>
      </header>

      {/* OUTSTANDING SUMMARY */}
      <section className="customers-summary-card">
        <div className="customers-summary-content">
          <span className="customers-summary-label">
            TOTAL OUTSTANDING
          </span>

          <strong className="customers-summary-amount">
            {formatCurrency(summary.totalOutstanding)}
          </strong>

          <span className="customers-summary-description">
            {summary.openCount} customers with open credit
          </span>
        </div>

        <UsersRound
          size={45}
          className="customers-summary-icon"
        />
      </section>

      {/* SEARCH */}
      <section className="customers-search-section">
        <div className="customers-search-box">
          <Search size={21} className="customers-search-icon" />

          <input
            type="text"
            className="customers-search-input"
            placeholder="Search customer, phone or area"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button
            type="button"
            className="customers-filter-trigger"
            aria-label="Filter customers"
            onClick={() => setShowFilters((prev) => !prev)}
          >
            <SlidersHorizontal size={21} />
          </button>
        </div>

        {showFilters && (
          <div className="customers-filter-options">
            {[
              { value: "all", label: "All" },
              { value: "open", label: "Open credit" },
              { value: "overdue", label: "Overdue" },
              { value: "clear", label: "Paid / clear" },
            ].map((option) => (
              <button
                type="button"
                key={option.value}
                className={`customers-filter-option ${
                  filter === option.value
                    ? "customers-filter-selected"
                    : ""
                }`}
                onClick={() => {
                  setFilter(option.value);
                  setShowFilters(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* LEDGER HEADING */}
      <section className="customers-ledger-heading">
        <h2>Credit ledger</h2>

        <button
          type="button"
          className="customers-add-button"
          onClick={() => navigate("/customers/add")}
        >
          Add customer
          <ChevronRight size={19} />
        </button>
      </section>

      {error && (
        <div className="customers-error-message">
          {error}
        </div>
      )}

      {/* CUSTOMER LIST */}
      <section className="customers-ledger-list">
        {filteredCustomers.length === 0 ? (
          <div className="customers-empty">
            <UsersRound size={34} />
            <p>No customers found.</p>
          </div>
        ) : (
          filteredCustomers.map((customer) => {
            const status = getCreditStatus(customer);
            const balance = getBalance(customer);
            const expanded = expandedId === customer._id;

            return (
              <div
                key={customer._id}
                className={`customers-ledger-card customers-card-${status}`}
              >
                <button
                  type="button"
                  className="customers-card-main"
                  aria-expanded={expanded}
                  onClick={() =>
                    setExpandedId(
                      expanded ? null : customer._id
                    )
                  }
                >
                  <div className="customers-avatar">
                    {customer.name?.trim().charAt(0).toUpperCase() || "C"}
                  </div>

                  <div className="customers-card-info">
                    <h3 className="customers-card-name">
                      {customer.name}
                    </h3>

                    <p className="customers-card-meta">
                      {[
                        customer.phone,
                        customer.address,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>

                    <p className="customers-card-lifetime">
                      Lifetime{" "}
                      {formatCurrency(customer.totalPurchases)}
                    </p>
                  </div>

                  <div className="customers-card-credit">
                    <strong
                      className={`customers-balance customers-balance-${status}`}
                    >
                      {balance > 0
                        ? formatCurrency(balance)
                        : "Clear"}
                    </strong>

                    <span
                      className={`customers-status customers-status-${status}`}
                    >
                      {statusLabel[status]}
                    </span>
                  </div>
                </button>

                {expanded && (
                  <div className="customers-expanded-details">
                    {customer.address && (
                      <p>
                        <MapPin size={16} />
                        {customer.address}
                      </p>
                    )}

                    {customer.phone && (
                      <p>
                        <Phone size={16} />
                        {customer.phone}
                      </p>
                    )}

                    {customer.email && (
                      <p>{customer.email}</p>
                    )}

                    {customer.gstin && (
                      <p>GSTIN: {customer.gstin}</p>
                    )}

                    <p>
                      Total paid:{" "}
                      {formatCurrency(customer.totalPaid)}
                    </p>

                    {balance > 0 && (
                      <button
                        type="button"
                        className="customers-individual-reminder"
                        onClick={() => sendReminder(customer)}
                      >
                        <Send size={17} />
                        Send payment reminder
                      </button>
                      
                    )}
                    <button
      type="button"
      className="customers-view-credit-button"
      onClick={() =>
        navigate(`/customers/${customer._id}/credit`)
      }
    >
      <Wallet size={18} />
      View credit / Receive payment
    </button>
                  </div>
                  
                )}
              </div>
            );
          })
        )}
      </section>

      {/* PAYMENT REMINDER */}
      {reminderCustomer && (
        <section className="customers-reminder-card">
          <BellRing
            size={25}
            className="customers-reminder-icon"
          />

          <div className="customers-reminder-content">
            <h3>Payment reminder</h3>
            <p>
              Send a WhatsApp reminder to{" "}
              {reminderCustomer.name}.
            </p>
          </div>

          <button
            type="button"
            className="customers-reminder-send"
            aria-label="Send WhatsApp reminder"
            onClick={() => sendReminder(reminderCustomer)}
          >
            <Send size={22} />
          </button>
        </section>
      )}

      {reminderError && (
        <div className="customers-error-message">
          {reminderError}
        </div>
      )}

      {/* CREDIT REPORT */}
      <button
        type="button"
        className="customers-report-button"
        onClick={() => setShowReport((prev) => !prev)}
      >
        <ChartNoAxesCombined size={22} />
        {showReport ? "Close credit report" : "Open credit report"}
      </button>

      {showReport && (
        <section className="customers-report-panel">
          <div className="customers-report-header">
            <h3>Credit summary</h3>

            <button
              type="button"
              onClick={() => setShowReport(false)}
              aria-label="Close report"
            >
              <X size={19} />
            </button>
          </div>

          <div className="customers-report-row">
            <span>Total customers</span>
            <strong>{summary.totalCustomers}</strong>
          </div>

          <div className="customers-report-row">
            <span>Customers with open credit</span>
            <strong>{summary.openCount}</strong>
          </div>

          <div className="customers-report-row">
            <span>Customers with overdue invoices</span>
            <strong>{summary.overdueCount}</strong>
          </div>

          <div className="customers-report-row">
            <span>Total outstanding</span>
            <strong>
              {formatCurrency(summary.totalOutstanding)}
            </strong>
          </div>
        </section>
      )}

      <OwnerBottomNav />
    </div>
  );
};

export default Customers;
