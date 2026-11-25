
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  RotateCcw,
  Search,
  Plus,
  X,
  Loader2,
  ArrowLeft,
  Package,
  Receipt,
  Banknote,
  Eye,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import OwnerBottomNav from "../components/OwnerBottomnav";
import "../styles/returns.css";

const API_URL = import.meta.env.VITE_API_URL 

const emptyForm = {
  refundMethod: "cash",
  reason: "",
  notes: "",
};

function Returns() {
  const navigate = useNavigate();

  const [returns, setReturns] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceResults, setShowInvoiceResults] = useState(false);

  const [invoiceReturns, setInvoiceReturns] = useState([]);
  const [loadingInvoiceReturns, setLoadingInvoiceReturns] = useState(false);

  const [customerDetails, setCustomerDetails] = useState(null);
  const [loadingCustomer, setLoadingCustomer] = useState(false);

  const [selectedReturn, setSelectedReturn] = useState(null);
  const [loadingReturnDetails, setLoadingReturnDetails] = useState(false);

  const [formData, setFormData] = useState(emptyForm);

  const [returnItems, setReturnItems] = useState({});

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const config = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  // Get product ID whether populated or not
  const getProductId = (product) => {
    if (!product) return "";
    return typeof product === "object"
      ? product._id
      : product;
  };

  // Fetch invoices and return history
  const fetchPageData = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [invoiceResponse, returnResponse] = await Promise.all([
        axios.get(`${API_URL}/api/invoices`, config()),
        axios.get(`${API_URL}/api/returns`, config()),
      ]);

      const invoiceData = invoiceResponse.data;
      const returnData = returnResponse.data;

      setInvoices(
        Array.isArray(invoiceData)
          ? invoiceData
          : invoiceData.invoices || invoiceData.data || []
      );

      setReturns(
        Array.isArray(returnData)
          ? returnData
          : returnData.returns || returnData.data || []
      );
    } catch (err) {
      console.error("Returns page fetch error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load returns information."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPageData();
  }, []);

  // Search invoices
  const filteredInvoices = useMemo(() => {
    const value = invoiceSearch.trim().toLowerCase();

    if (!value) return [];

    return invoices
      .filter((invoice) => {
        const invoiceNumber = invoice.invoiceNumber || "";
        const customerName = invoice.customerName || "";
        const customerPhone = invoice.customerPhone || "";

        return (
          invoiceNumber.toLowerCase().includes(value) ||
          customerName.toLowerCase().includes(value) ||
          customerPhone.toLowerCase().includes(value)
        );
      })
      .filter((invoice) => invoice.status !== "cancelled")
      .slice(0, 8);
  }, [invoices, invoiceSearch]);

  // Select invoice and load its previous returns
  const handleSelectInvoice = async (invoice) => {
    setSelectedInvoice(invoice);
    setInvoiceSearch(invoice.invoiceNumber || "");
    setShowInvoiceResults(false);
    setInvoiceReturns([]);
    setCustomerDetails(null);
    setError("");

    const productQuantities = {};

    (invoice.items || []).forEach((item) => {
      const productId = getProductId(item.product);

      if (productId) {
        productQuantities[productId] = {
          quantity: "",
          restock: true,
        };
      }
    });

    setReturnItems(productQuantities);

    try {
      setLoadingInvoiceReturns(true);

      const response = await axios.get(
        `${API_URL}/api/returns/invoice/${invoice._id}`,
        config()
      );

      setInvoiceReturns(response.data.returns || []);
    } catch (err) {
      console.error("Previous returns fetch error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load previous returns for this invoice."
      );
    } finally {
      setLoadingInvoiceReturns(false);
    }

    // Load customer balance for credit adjustment
    const customerId = getProductId(invoice.customer);

    if (customerId) {
      try {
        setLoadingCustomer(true);

        const response = await axios.get(
          `${API_URL}/api/customers/${customerId}`,
          config()
        );

        setCustomerDetails(
          response.data.customer || response.data
        );
      } catch (err) {
        console.error("Customer details fetch error:", err);
      } finally {
        setLoadingCustomer(false);
      }
    }
  };

  // Calculate previously returned quantities
  const previouslyReturned = useMemo(() => {
    const quantities = {};

    invoiceReturns.forEach((returnDoc) => {
      (returnDoc.items || []).forEach((item) => {
        const productId = getProductId(item.product);

        quantities[productId] =
          (quantities[productId] || 0) +
          Number(item.quantity || 0);
      });
    });

    return quantities;
  }, [invoiceReturns]);

  // Remaining returnable quantity
  const getAvailableQuantity = (item) => {
    const productId = getProductId(item.product);

    return Math.max(
      0,
      Number(item.quantity || 0) -
        (previouslyReturned[productId] || 0)
    );
  };

  // Calculate refund for one item
  const getItemRefund = (item) => {
    const productId = getProductId(item.product);
    const quantity = Number(
      returnItems[productId]?.quantity || 0
    );

    if (!quantity || !item.quantity) return 0;

    const pricePerUnit =
      Number(item.total || 0) / Number(item.quantity);

    return Number((pricePerUnit * quantity).toFixed(2));
  };

  // Total refund
  const totalRefund = useMemo(() => {
    if (!selectedInvoice) return 0;

    return Number(
      selectedInvoice.items
        .reduce(
          (total, item) => total + getItemRefund(item),
          0
        )
        .toFixed(2)
    );
  }, [selectedInvoice, returnItems, previouslyReturned]);

  // Update return quantity
  const handleQuantityChange = (productId, value) => {
    setReturnItems((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        quantity: value,
      },
    }));
  };

  // Update restock option
  const handleRestockChange = (productId, checked) => {
    setReturnItems((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        restock: checked,
      },
    }));
  };

  // Reset create form
  const resetCreateForm = () => {
    setSelectedInvoice(null);
    setInvoiceSearch("");
    setInvoiceReturns([]);
    setCustomerDetails(null);
    setReturnItems({});
    setFormData(emptyForm);
    setError("");
    setShowInvoiceResults(false);
  };

  // Submit return
  const handleCreateReturn = async (e) => {
    e.preventDefault();

    if (!selectedInvoice) {
      setError("Please select an invoice.");
      return;
    }

    const items = (selectedInvoice.items || [])
      .map((item) => {
        const productId = getProductId(item.product);
        const selected = returnItems[productId];

        return {
          productId,
          quantity: Number(selected?.quantity || 0),
          restock: selected?.restock ?? true,
        };
      })
      .filter((item) => item.quantity > 0);

    if (items.length === 0) {
      setError("Select at least one product to return.");
      return;
    }

    for (const selected of items) {
      const originalItem = selectedInvoice.items.find(
        (item) =>
          getProductId(item.product) === selected.productId
      );

      const available = getAvailableQuantity(originalItem);

      if (selected.quantity > available) {
        setError(
          `Only ${available} ${originalItem.unit} can be returned for ${originalItem.productName}.`
        );
        return;
      }
    }

    if (
      formData.refundMethod === "credit_adjustment" &&
      !customerDetails
    ) {
      setError(
        "Credit adjustment requires a registered customer."
      );
      return;
    }

    if (
      formData.refundMethod === "credit_adjustment" &&
      totalRefund > Number(customerDetails?.creditBalance || 0)
    ) {
      setError(
        "Refund amount cannot be greater than the customer's outstanding credit."
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const response = await axios.post(
        `${API_URL}/api/returns`,
        {
          invoiceId: selectedInvoice._id,
          items,
          refundMethod: formData.refundMethod,
          reason: formData.reason,
          notes: formData.notes,
        },
        config()
      );

      setSuccess(
        response.data.message || "Return processed successfully!"
      );

      setShowCreateModal(false);
      resetCreateForm();

      await fetchPageData(true);
    } catch (err) {
      console.error("Create return error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to process return."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // View return details
  const handleViewReturn = async (returnId) => {
    try {
      setLoadingReturnDetails(true);
      setSelectedReturn(null);

      const response = await axios.get(
        `${API_URL}/api/returns/${returnId}`,
        config()
      );

      setSelectedReturn(
        response.data.return || response.data
      );
    } catch (err) {
      console.error("Return details error:", err);

      alert(
        err.response?.data?.message ||
          "Unable to load return details."
      );
    } finally {
      setLoadingReturnDetails(false);
    }
  };

  // Filter return history
  const filteredReturns = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return returns;

    return returns.filter((item) => {
      return (
        item.invoiceNumber?.toLowerCase().includes(value) ||
        item.customerName?.toLowerCase().includes(value) ||
        item.refundMethod?.toLowerCase().includes(value)
      );
    });
  }, [returns, search]);

  // Format currency
  const formatCurrency = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // Format date
  const formatDate = (dateValue) => {
    if (!dateValue) return "Date unavailable";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const registeredCustomer = Boolean(
    selectedInvoice?.customer
  );

  return (
    <div className="returns-page">

      {/* Header */}
      <div className="returns-header">
        <div>
          <h1>Returns</h1>
          <p>Manage returned products and customer refunds</p>
        </div>

        <button
          type="button"
          className="returns-add-button"
          onClick={() => {
            resetCreateForm();
            setShowCreateModal(true);
          }}
        >
          <Plus size={18} />
          New Return
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="returns-success-message">
          <CheckCircle2 size={19} />
          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* Summary */}
      <div className="returns-summary">

        <div className="returns-summary-card">
          <div className="returns-summary-icon">
            <RotateCcw size={22} />
          </div>

          <div>
            <p>Total Returns</p>
            <h2>{returns.length}</h2>
          </div>
        </div>

        <div className="returns-summary-card">
          <div className="returns-summary-icon returns-refund-icon">
            <Banknote size={22} />
          </div>

          <div>
            <p>Total Refunds</p>
            <h2>
              {formatCurrency(
                returns.reduce(
                  (total, item) =>
                    total + Number(item.totalRefundAmount || 0),
                  0
                )
              )}
            </h2>
          </div>
        </div>

      </div>

      {/* History Header */}
      <div className="returns-list-header">
        <div>
          <h2>Return History</h2>
          <p>View previously processed returns</p>
        </div>

        <button
          type="button"
          className="returns-refresh-button"
          onClick={() => fetchPageData(true)}
          disabled={refreshing}
          title="Refresh"
        >
          <RefreshCw
            size={18}
            className={
              refreshing ? "returns-spinning" : ""
            }
          />
        </button>
      </div>

      {/* Search */}
      <div className="returns-search-box">
        <Search size={19} />

        <input
          type="text"
          placeholder="Search invoice or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* History */}
      {loading ? (
        <div className="returns-loading">
          <Loader2 size={30} className="returns-spinning" />
          <p>Loading return history...</p>
        </div>
      ) : error && returns.length === 0 ? (
        <div className="returns-empty">
          <AlertCircle size={35} />
          <p>{error}</p>

          <button
            type="button"
            onClick={() => fetchPageData()}
          >
            Try Again
          </button>
        </div>
      ) : filteredReturns.length === 0 ? (
        <div className="returns-empty">
          <Package size={42} />
          <h3>No returns found</h3>
          <p>
            {search
              ? "Try another search."
              : "Processed returns will appear here."}
          </p>
        </div>
      ) : (
        <div className="returns-history-list">

          {filteredReturns.map((item) => (
            <div
              className="returns-history-card"
              key={item._id}
            >

              <div className="returns-history-top">
                <div className="returns-history-icon">
                  <RotateCcw size={21} />
                </div>

                <div className="returns-history-info">
                  <h3>{item.invoiceNumber}</h3>
                  <p>{item.customerName || "Walk-in Customer"}</p>
                </div>

                <span className="returns-method-badge">
                  {String(item.refundMethod || "").replace(
                    "_",
                    " "
                  )}
                </span>
              </div>

              <div className="returns-history-details">
                <div>
                  <span>Items returned</span>
                  <strong>{item.items?.length || 0}</strong>
                </div>

                <div>
                  <span>Refund amount</span>
                  <strong>
                    {formatCurrency(item.totalRefundAmount)}
                  </strong>
                </div>
              </div>

              <div className="returns-history-footer">
                <span>{formatDate(item.returnDate)}</span>

                <button
                  type="button"
                  onClick={() => handleViewReturn(item._id)}
                >
                  <Eye size={16} />
                  View Details
                </button>
              </div>

            </div>
          ))}

        </div>
      )}

      {/* Create Return Modal */}
      {showCreateModal && (
        <div
          className="returns-modal-overlay"
          onClick={() => {
            if (!submitting) {
              setShowCreateModal(false);
              resetCreateForm();
            }
          }}
        >
          <div
            className="returns-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="returns-modal-header">
              <div>
                <h2>Process Return</h2>
                <p>Select an original invoice to continue</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!submitting) {
                    setShowCreateModal(false);
                    resetCreateForm();
                  }
                }}
                disabled={submitting}
              >
                <X size={21} />
              </button>
            </div>

            <form
              className="returns-form"
              onSubmit={handleCreateReturn}
            >

              {/* Invoice Search */}
              <div className="returns-form-group">
                <label>Search Invoice</label>

                <div className="returns-invoice-search">
                  <Search size={18} />

                  <input
                    type="text"
                    placeholder="Invoice number or customer name"
                    value={invoiceSearch}
                    onChange={(e) => {
                      setInvoiceSearch(e.target.value);
                      setSelectedInvoice(null);
                      setCustomerDetails(null);
                      setInvoiceReturns([]);
                      setShowInvoiceResults(true);
                    }}
                    onFocus={() => setShowInvoiceResults(true)}
                  />
                </div>

                {showInvoiceResults &&
                  invoiceSearch.trim() &&
                  !selectedInvoice && (
                    <div className="returns-invoice-results">

                      {filteredInvoices.length === 0 ? (
                        <p>No matching invoices found.</p>
                      ) : (
                        filteredInvoices.map((invoice) => (
                          <button
                            type="button"
                            key={invoice._id}
                            onClick={() =>
                              handleSelectInvoice(invoice)
                            }
                          >
                            <div>
                              <strong>
                                {invoice.invoiceNumber}
                              </strong>
                              <span>
                                {invoice.customerName ||
                                  "Walk-in Customer"}
                              </span>
                            </div>

                            <strong>
                              {formatCurrency(invoice.grandTotal)}
                            </strong>
                          </button>
                        ))
                      )}

                    </div>
                  )}
              </div>

              {/* Selected Invoice */}
              {selectedInvoice && (
                <>
                  <div className="returns-selected-invoice">
                    <div className="returns-selected-invoice-icon">
                      <Receipt size={21} />
                    </div>

                    <div>
                      <strong>
                        {selectedInvoice.invoiceNumber}
                      </strong>
                      <p>
                        {selectedInvoice.customerName ||
                          "Walk-in Customer"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedInvoice(null);
                        setInvoiceSearch("");
                        setCustomerDetails(null);
                        setInvoiceReturns([]);
                      }}
                    >
                      Change
                    </button>
                  </div>

                  {/* Customer Credit Balance */}
                  {registeredCustomer && (
                    <div className="returns-customer-balance">
                      {loadingCustomer
                        ? "Loading customer balance..."
                        : `Customer outstanding credit: ${formatCurrency(
                            customerDetails?.creditBalance || 0
                          )}`}
                    </div>
                  )}

                  {/* Products */}
                  <div className="returns-products-heading">
                    <h3>Purchased Products</h3>
                    <span>
                      Enter the quantity to return
                    </span>
                  </div>

                  {loadingInvoiceReturns ? (
                    <div className="returns-inline-loading">
                      <Loader2
                        size={20}
                        className="returns-spinning"
                      />
                      Loading previous returns...
                    </div>
                  ) : (
                    <div className="returns-product-list">

                      {(selectedInvoice.items || []).map(
                        (item, index) => {
                          const productId = getProductId(
                            item.product
                          );

                          const available =
                            getAvailableQuantity(item);

                          const quantity = Number(
                            returnItems[productId]?.quantity || 0
                          );

                          return (
                            <div
                              className="returns-product-card"
                              key={productId || index}
                            >

                              <div className="returns-product-top">
                                <div>
                                  <h4>{item.productName}</h4>
                                  <p>
                                    Code: {item.productCode}
                                  </p>
                                </div>

                                <span>
                                  {formatCurrency(item.total)}
                                </span>
                              </div>

                              <div className="returns-product-bottom">

                                <div>
                                  <span>Sold</span>
                                  <strong>
                                    {item.quantity} {item.unit}
                                  </strong>
                                </div>

                                <div>
                                  <span>Already returned</span>
                                  <strong>
                                    {previouslyReturned[productId] || 0}
                                  </strong>
                                </div>

                                <div>
                                  <span>Available</span>
                                  <strong>{available}</strong>
                                </div>

                              </div>

                              {available > 0 ? (
                                <>
                                  <div className="returns-quantity-field">
                                    <label>
                                      Return Quantity ({item.unit})
                                    </label>

                                    <input
                                      type="number"
                                      min="0"
                                      max={available}
                                      step="0.01"
                                      value={
                                        returnItems[productId]?.quantity ||
                                        ""
                                      }
                                      onChange={(e) =>
                                        handleQuantityChange(
                                          productId,
                                          e.target.value
                                        )
                                      }
                                      placeholder="Enter quantity"
                                    />
                                  </div>

                                  <label className="returns-restock-option">
                                    <input
                                      type="checkbox"
                                      checked={
                                        returnItems[productId]?.restock ??
                                        true
                                      }
                                      onChange={(e) =>
                                        handleRestockChange(
                                          productId,
                                          e.target.checked
                                        )
                                      }
                                    />

                                    Add returned quantity back to stock
                                  </label>
                                </>
                              ) : (
                                <div className="returns-fully-returned">
                                  <CheckCircle2 size={16} />
                                  Fully returned
                                </div>
                              )}

                              {quantity > 0 && (
                                <div className="returns-item-refund">
                                  Refund:
                                  <strong>
                                    {formatCurrency(
                                      getItemRefund(item)
                                    )}
                                  </strong>
                                </div>
                              )}

                            </div>
                          );
                        }
                      )}

                    </div>
                  )}

                  {/* Refund Method */}
                  <div className="returns-form-group">
                    <label>Refund Method</label>

                    <select
                      value={formData.refundMethod}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          refundMethod: e.target.value,
                        }))
                      }
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option
                        value="credit_adjustment"
                        disabled={
                          !registeredCustomer ||
                          loadingCustomer ||
                          !customerDetails ||
                          Number(customerDetails.creditBalance || 0) <= 0
                        }
                      >
                        Credit Adjustment
                      </option>
                    </select>

                    {formData.refundMethod ===
                      "credit_adjustment" && (
                      <small>
                        This reduces the customer's outstanding credit.
                      </small>
                    )}
                  </div>

                  {/* Reason */}
                  <div className="returns-form-group">
                    <label>Return Reason</label>

                    <select
                      value={formData.reason}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          reason: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select reason (optional)</option>
                      <option value="Damaged product">
                        Damaged product
                      </option>
                      <option value="Wrong product">
                        Wrong product
                      </option>
                      <option value="Incorrect quantity">
                        Incorrect quantity
                      </option>
                      <option value="Customer changed mind">
                        Customer changed mind
                      </option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Notes */}
                  <div className="returns-form-group">
                    <label>Additional Notes</label>

                    <textarea
                      rows={3}
                      placeholder="Enter additional details..."
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                    />
                  </div>

                  {/* Refund Total */}
                  <div className="returns-total-box">
                    <span>Total Refund Amount</span>
                    <strong>{formatCurrency(totalRefund)}</strong>
                  </div>
                </>
              )}

              {/* Error */}
              {error && (
                <div className="returns-form-error">
                  <AlertCircle size={17} />
                  {error}
                </div>
              )}

              {/* Submit */}
              <div className="returns-form-actions">

                <button
                  type="button"
                  className="returns-cancel-button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetCreateForm();
                  }}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="returns-submit-button"
                  disabled={
                    submitting ||
                    !selectedInvoice ||
                    loadingInvoiceReturns ||
                    totalRefund <= 0
                  }
                >
                  {submitting ? (
                    <>
                      <Loader2
                        size={18}
                        className="returns-spinning"
                      />
                      Processing...
                    </>
                  ) : (
                    <>
                      <RotateCcw size={18} />
                      Process Return
                    </>
                  )}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

      {/* Return Details Modal */}
      {(selectedReturn || loadingReturnDetails) && (
        <div
          className="returns-modal-overlay"
          onClick={() => setSelectedReturn(null)}
        >
          <div
            className="returns-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="returns-modal-header">
              <div>
                <h2>Return Details</h2>
                <p>
                  {selectedReturn?.invoiceNumber || "Loading..."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReturn(null)}
              >
                <X size={21} />
              </button>
            </div>

            {loadingReturnDetails ? (
              <div className="returns-loading">
                <Loader2
                  size={27}
                  className="returns-spinning"
                />
                <p>Loading return details...</p>
              </div>
            ) : (
              <>
                <div className="returns-detail-info">
                  <div>
                    <span>Customer</span>
                    <strong>
                      {selectedReturn.customerName ||
                        "Walk-in Customer"}
                    </strong>
                  </div>

                  <div>
                    <span>Return Date</span>
                    <strong>
                      {formatDate(selectedReturn.returnDate)}
                    </strong>
                  </div>

                  <div>
                    <span>Refund Method</span>
                    <strong>
                      {String(
                        selectedReturn.refundMethod || ""
                      ).replace("_", " ")}
                    </strong>
                  </div>

                  <div>
                    <span>Processed By</span>
                    <strong>
                      {selectedReturn.processedBy?.name ||
                        "Not available"}
                    </strong>
                  </div>
                </div>

                <h3 className="returns-detail-items-heading">
                  Returned Items
                </h3>

                <div className="returns-detail-items">
                  {(selectedReturn.items || []).map(
                    (item, index) => (
                      <div
                        className="returns-detail-item"
                        key={item.product?._id || index}
                      >
                        <div>
                          <strong>{item.productName}</strong>
                          <p>
                            {item.quantity} {item.unit} ×{" "}
                            {formatCurrency(item.rate)}
                          </p>
                          <small>
                            {item.restock
                              ? "Added back to stock"
                              : "Not restocked"}
                          </small>
                        </div>

                        <strong>
                          {formatCurrency(item.refundAmount)}
                        </strong>
                      </div>
                    )
                  )}
                </div>

                <div className="returns-detail-total">
                  <span>Total Refund</span>
                  <strong>
                    {formatCurrency(
                      selectedReturn.totalRefundAmount
                    )}
                  </strong>
                </div>

                {selectedReturn.reason && (
                  <div className="returns-detail-notes">
                    <span>Reason</span>
                    <p>{selectedReturn.reason}</p>
                  </div>
                )}

                {selectedReturn.notes && (
                  <div className="returns-detail-notes">
                    <span>Notes</span>
                    <p>{selectedReturn.notes}</p>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      )}

      <OwnerBottomNav />
    </div>
  );
}

export default Returns;
