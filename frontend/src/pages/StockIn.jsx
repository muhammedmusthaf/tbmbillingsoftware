import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";

import {
  ArrowLeft,
  Search,
  Package,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import "../styles/stockin.css";

import OwnerBottomNav from "../components/OwnerBottomnav";


const StockIn = () => {
  const navigate = useNavigate();

  const API_URL =
    import.meta.env.VITE_API_URL;

  const token =
    localStorage.getItem("token");


  // ==========================================
  // STATE
  // ==========================================

  const [products, setProducts] =
    useState([]);

  const [selectedItems, setSelectedItems] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [supplier, setSupplier] =
    useState("");

  const [
    purchaseInvoiceNumber,
    setPurchaseInvoiceNumber,
  ] = useState("");

  const [transactionDate, setTransactionDate] =
    useState(
      new Date()
        .toISOString()
        .split("T")[0]
    );

  const [notes, setNotes] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  // ==========================================
  // AUTH
  // ==========================================

  const authConfig = {
    headers: {
      Authorization:
        `Bearer ${token}`,
    },
  };


  // ==========================================
  // FETCH PRODUCTS
  // ==========================================

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await axios.get(
          `${API_URL}/api/products`,
          authConfig
        );

      const data =
        response.data;

      const productList =
        Array.isArray(data)
          ? data
          : data.products || [];

      setProducts(productList);

    } catch (err) {
      console.error(
        "STOCK IN PRODUCTS ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load products."
      );

    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // LOAD
  // ==========================================

  useEffect(() => {
    fetchProducts();
  }, []);


  // ==========================================
  // SEARCH PRODUCTS
  // ==========================================

  const filteredProducts =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      if (!value) {
        return [];
      }

      return products
        .filter((product) => {
          const searchable = [
            product.name,
            product.productCode,
            product.barcode,
            product.brand,
            product.category,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchable.includes(
            value
          );
        })
        .slice(0, 8);

    }, [products, search]);


  // ==========================================
  // ADD PRODUCT
  // ==========================================

  const addProduct = (product) => {
    const alreadyAdded =
      selectedItems.some(
        (item) =>
          item.productId ===
          product._id
      );

    if (alreadyAdded) {
      setError(
        "This product is already added."
      );

      return;
    }

    setError("");
    setSearch("");

    setSelectedItems(
      (previous) => [
        ...previous,

        {
          productId:
            product._id,

          name:
            product.name,

          productCode:
            product.productCode,

          unit:
            product.unit,

          currentStock:
            Number(
              product.stock || 0
            ),

          quantity: 1,

          purchasePrice:
            Number(
              product.purchasePrice ||
                0
            ),

          sellingPrice:
            Number(
              product.sellingPrice ||
                0
            ),

          gst:
            Number(
              product.gst || 0
            ),

          image:
            product.image || "",
        },
      ]
    );
  };


  // ==========================================
  // UPDATE ITEM
  // ==========================================

  const updateItem = (
    productId,
    field,
    value
  ) => {
    setSelectedItems(
      (previous) =>
        previous.map(
          (item) =>
            item.productId ===
            productId
              ? {
                  ...item,
                  [field]: value,
                }
              : item
        )
    );
  };


  // ==========================================
  // INCREASE QUANTITY
  // ==========================================

  const increaseQuantity = (
    productId
  ) => {
    setSelectedItems(
      (previous) =>
        previous.map(
          (item) =>
            item.productId ===
            productId
              ? {
                  ...item,

                  quantity:
                    Number(
                      item.quantity ||
                        0
                    ) + 1,
                }
              : item
        )
    );
  };


  // ==========================================
  // DECREASE QUANTITY
  // ==========================================

  const decreaseQuantity = (
    productId
  ) => {
    setSelectedItems(
      (previous) =>
        previous.map(
          (item) => {
            if (
              item.productId !==
              productId
            ) {
              return item;
            }

            return {
              ...item,

              quantity:
                Math.max(
                  1,
                  Number(
                    item.quantity ||
                      1
                  ) - 1
                ),
            };
          }
        )
    );
  };


  // ==========================================
  // REMOVE PRODUCT
  // ==========================================

  const removeProduct = (
    productId
  ) => {
    setSelectedItems(
      (previous) =>
        previous.filter(
          (item) =>
            item.productId !==
            productId
        )
    );
  };


  // ==========================================
  // TOTAL QUANTITY
  // ==========================================

  const totalQuantity =
    selectedItems.reduce(
      (total, item) =>
        total +
        Number(
          item.quantity || 0
        ),
      0
    );


  // ==========================================
  // TOTAL PURCHASE VALUE
  // ==========================================

  const totalPurchaseAmount =
    selectedItems.reduce(
      (total, item) =>
        total +
        Number(
          item.quantity || 0
        ) *
          Number(
            item.purchasePrice ||
              0
          ),
      0
    );


  // ==========================================
  // FORMAT CURRENCY
  // ==========================================

  const formatCurrency = (
    amount = 0
  ) => {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }
    ).format(
      Number(amount || 0)
    );
  };


  // ==========================================
  // SAVE STOCK
  // ==========================================

  const handleStockIn = async () => {
    if (
      selectedItems.length === 0
    ) {
      setError(
        "Add at least one product."
      );

      return;
    }


    const invalidItem =
      selectedItems.find(
        (item) =>
          Number(
            item.quantity
          ) <= 0 ||
          Number(
            item.purchasePrice
          ) < 0 ||
          Number(
            item.sellingPrice
          ) < 0
      );


    if (invalidItem) {
      setError(
        "Please enter valid quantity and prices."
      );

      return;
    }


    try {
      setSaving(true);
      setError("");
      setSuccess("");


      const payload = {
        supplier:
          supplier.trim(),

        purchaseInvoiceNumber:
          purchaseInvoiceNumber.trim(),

        transactionDate,

        notes:
          notes.trim(),

        items:
          selectedItems.map(
            (item) => ({
              productId:
                item.productId,

              quantity:
                Number(
                  item.quantity
                ),

              purchasePrice:
                Number(
                  item.purchasePrice
                ),

              sellingPrice:
                Number(
                  item.sellingPrice
                ),

              gst:
                Number(
                  item.gst || 0
                ),
            })
          ),
      };


      await axios.post(
        `${API_URL}/api/inventory/stock-in`,
        payload,
        authConfig
      );


      setSuccess(
        "Stock added successfully."
      );


      setTimeout(() => {
        navigate(
          "/inventory",
          {
            replace: true,
          }
        );
      }, 700);


    } catch (err) {
      console.error(
        "STOCK IN ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to add stock."
      );

    } finally {
      setSaving(false);
    }
  };


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="stockin-loading-page">

        <div className="stockin-loading-text">
          Loading products...
        </div>

      </div>
    );
  }


  // ==========================================
  // JSX
  // ==========================================

  return (
    <div className="stockin-page">


      {/* =====================================
          HEADER
      ===================================== */}

      <header className="stockin-header">

        <button
          type="button"
          className="stockin-back-button"
          onClick={() =>
            navigate(
              "/inventory"
            )
          }
        >
          <ArrowLeft size={23} />
        </button>


        <div className="stockin-header-info">

          <h1 className="stockin-title">
            Stock in
          </h1>

          <p className="stockin-subtitle">
            Add new stock to inventory
          </p>

        </div>

      </header>


      {/* =====================================
          SEARCH PRODUCT
      ===================================== */}

      <section className="stockin-search-section">

        <label className="stockin-field-label">
          Add products
        </label>


        <div className="stockin-search-box">

          <Search
            size={21}
            className="stockin-search-icon"
          />

          <input
            type="text"
            className="stockin-search-input"
            placeholder="Search product or SKU"
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

        </div>


        {/* SEARCH RESULTS */}

        {search.trim() &&
          filteredProducts.length >
            0 && (

          <div className="stockin-search-results">

            {filteredProducts.map(
              (product) => (

                <button
                  type="button"
                  key={product._id}
                  className="stockin-search-result"
                  onClick={() =>
                    addProduct(
                      product
                    )
                  }
                >

                  <div className="stockin-search-product-icon">

                    {product.image ? (

                      <img
                        src={
                          product.image
                        }
                        alt={
                          product.name
                        }
                        className="stockin-search-product-image"
                      />

                    ) : (

                      <Package
                        size={22}
                      />

                    )}

                  </div>


                  <div className="stockin-search-product-info">

                    <strong>
                      {product.name}
                    </strong>

                    <span>
                      {product.productCode}
                      {" · "}
                      Current stock:{" "}
                      {product.stock}
                    </span>

                  </div>


                  <Plus size={20} />

                </button>

              )
            )}

          </div>

        )}

      </section>


      {/* =====================================
          SELECTED PRODUCTS
      ===================================== */}

      <section className="stockin-items-section">

        <div className="stockin-section-heading">

          <h2>
            Products
          </h2>

          <span>
            {selectedItems.length}{" "}
            {selectedItems.length === 1
              ? "product"
              : "products"}
          </span>

        </div>


        {selectedItems.length ===
        0 ? (

          <div className="stockin-empty-products">

            <Package size={36} />

            <h3>
              No products added
            </h3>

            <p>
              Search and select products to add stock.
            </p>

          </div>

        ) : (

          <div className="stockin-product-list">

            {selectedItems.map(
              (item) => (

                <div
                  className="stockin-product-card"
                  key={
                    item.productId
                  }
                >


                  {/* PRODUCT TOP */}

                  <div className="stockin-product-top">

                    <div className="stockin-product-main">

                      <div className="stockin-product-icon">

                        {item.image ? (

                          <img
                            src={
                              item.image
                            }
                            alt={
                              item.name
                            }
                            className="stockin-product-image"
                          />

                        ) : (

                          <Package
                            size={23}
                          />

                        )}

                      </div>


                      <div className="stockin-product-info">

                        <h3>
                          {item.name}
                        </h3>

                        <p>
                          {item.productCode}
                          {" · "}
                          Stock:{" "}
                          {item.currentStock}
                        </p>

                      </div>

                    </div>


                    <button
                      type="button"
                      className="stockin-remove-button"
                      onClick={() =>
                        removeProduct(
                          item.productId
                        )
                      }
                    >
                      <Trash2
                        size={19}
                      />
                    </button>

                  </div>


                  {/* QUANTITY */}

                  <div className="stockin-product-field">

                    <label>
                      Quantity received
                    </label>


                    <div className="stockin-quantity-control">

                      <button
                        type="button"
                        onClick={() =>
                          decreaseQuantity(
                            item.productId
                          )
                        }
                      >
                        <Minus
                          size={18}
                        />
                      </button>


                      <input
                        type="number"
                        min="1"
                        value={
                          item.quantity
                        }
                        onChange={(e) =>
                          updateItem(
                            item.productId,
                            "quantity",
                            e.target.value
                          )
                        }
                      />


                      <button
                        type="button"
                        onClick={() =>
                          increaseQuantity(
                            item.productId
                          )
                        }
                      >
                        <Plus
                          size={18}
                        />
                      </button>

                    </div>

                  </div>


                  {/* PRICES */}

                  <div className="stockin-price-grid">


                    <div className="stockin-product-field">

                      <label>
                        Purchase price
                      </label>

                      <div className="stockin-money-input">

                        <span>
                          ₹
                        </span>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            item.purchasePrice
                          }
                          onChange={(e) =>
                            updateItem(
                              item.productId,
                              "purchasePrice",
                              e.target.value
                            )
                          }
                        />

                      </div>

                    </div>


                    <div className="stockin-product-field">

                      <label>
                        Selling price
                      </label>

                      <div className="stockin-money-input">

                        <span>
                          ₹
                        </span>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            item.sellingPrice
                          }
                          onChange={(e) =>
                            updateItem(
                              item.productId,
                              "sellingPrice",
                              e.target.value
                            )
                          }
                        />

                      </div>

                    </div>

                  </div>


                  {/* NEW STOCK */}

                  <div className="stockin-new-stock">

                    <span>
                      New stock
                    </span>

                    <strong>
                      {Number(
                        item.currentStock ||
                          0
                      ) +
                        Number(
                          item.quantity ||
                            0
                        )}{" "}
                      {item.unit || ""}
                    </strong>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </section>


      {/* =====================================
          PURCHASE DETAILS
      ===================================== */}

      <section className="stockin-details-section">

        <h2 className="stockin-section-title">
          Purchase details
        </h2>


        <div className="stockin-form-field">

          <label>
            Supplier
          </label>

          <input
            type="text"
            placeholder="Supplier name"
            value={supplier}
            onChange={(e) =>
              setSupplier(
                e.target.value
              )
            }
          />

        </div>


        <div className="stockin-form-field">

          <label>
            Supplier invoice number
          </label>

          <input
            type="text"
            placeholder="Enter invoice number"
            value={
              purchaseInvoiceNumber
            }
            onChange={(e) =>
              setPurchaseInvoiceNumber(
                e.target.value
              )
            }
          />

        </div>


        <div className="stockin-form-field">

          <label>
            Date
          </label>

          <input
            type="date"
            value={
              transactionDate
            }
            onChange={(e) =>
              setTransactionDate(
                e.target.value
              )
            }
          />

        </div>


        <div className="stockin-form-field">

          <label>
            Notes
          </label>

          <textarea
            rows="3"
            placeholder="Optional notes"
            value={notes}
            onChange={(e) =>
              setNotes(
                e.target.value
              )
            }
          />

        </div>

      </section>


      {/* =====================================
          SUMMARY
      ===================================== */}

      {selectedItems.length >
        0 && (

        <section className="stockin-summary-section">

          <div className="stockin-summary-row">

            <span>
              Total quantity
            </span>

            <strong>
              {totalQuantity}
            </strong>

          </div>


          <div className="stockin-summary-row">

            <span>
              Purchase value
            </span>

            <strong>
              {formatCurrency(
                totalPurchaseAmount
              )}
            </strong>

          </div>

        </section>

      )}


      {/* =====================================
          MESSAGE
      ===================================== */}

      {error && (

        <div className="stockin-error-message">
          {error}
        </div>

      )}


      {success && (

        <div className="stockin-success-message">

          <CheckCircle2
            size={20}
          />

          <span>
            {success}
          </span>

        </div>

      )}


      {/* =====================================
          SAVE
      ===================================== */}

      <section className="stockin-save-section">

        <button
          type="button"
          className="stockin-save-button"
          disabled={
            saving ||
            selectedItems.length ===
              0
          }
          onClick={
            handleStockIn
          }
        >

          <Plus size={22} />

          <span>
            {saving
              ? "Adding stock..."
              : "Add stock"}
          </span>

        </button>

      </section>


      {/* =====================================
          BOTTOM NAV
      ===================================== */}

      <OwnerBottomNav />

    </div>
  );
};

export default StockIn;