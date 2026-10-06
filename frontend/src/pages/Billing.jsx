import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import axios from "axios";
import "../styles/billing.css";

import {
  Bell,
  ScanLine,
  Search,
  SlidersHorizontal,
  Minus,
  Plus,
  ChevronRight,
  Wrench,
  ArrowRight,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import OwnerBottomNav from "../components/OwnerBottomnav";




// ==========================================
// BILLING PAGE
// ==========================================

const Billing = () => {
  const navigate = useNavigate();

  const API_URL =
    import.meta.env.VITE_API_URL;

  const token =
    localStorage.getItem("token");

  const searchInputRef =
    useRef(null);


  // ==========================================
  // USER
  // ==========================================

  let storedUser = {};

  try {
    storedUser = JSON.parse(
      localStorage.getItem("user") ||
        "{}"
    );
  } catch {
    storedUser = {};
  }


  // ==========================================
  // STATE
  // ==========================================

  const [products, setProducts] =
    useState([]);

  const [settings, setSettings] =
    useState({
      shopName: "",
      logo: "",
      showGST: false,
    });

  const [cart, setCart] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState("All");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ==========================================
  // AUTH CONFIG
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
  };


  // ==========================================
  // FETCH SETTINGS
  // ==========================================

  const fetchSettings = async () => {
    const response =
      await axios.get(
        `${API_URL}/api/settings`,
        authConfig
      );

    const data =
      response.data.settings ||
      response.data;

    setSettings({
      shopName:
        data.shopName || "",

      logo:
        data.logo || "",
    showGST:
        data.showGST === true,
    });
  };


  // ==========================================
  // LOAD BILLING PAGE
  // ==========================================

  useEffect(() => {
    const loadBilling = async () => {
      try {
        setLoading(true);
        setError("");

        await Promise.all([
          fetchProducts(),
          fetchSettings(),
        ]);

      } catch (err) {

        console.error(
          "BILLING LOAD ERROR:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Unable to load billing data."
        );

      } finally {

        setLoading(false);

      }
    };

    loadBilling();
  }, []);


  // ==========================================
  // CATEGORIES
  // ==========================================

  const categories =
    useMemo(() => {
      const categoryList =
        products
          .map((product) =>
            product.category?.trim()
          )
          .filter(Boolean);

      return [
        "All",
        ...new Set(categoryList),
      ];
    }, [products]);


 // ==========================================
// SEARCH HELPERS
// ==========================================

const normalizeSearchText = (value = "") => {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
};


// Allows small missing letters while typing.
// Example:
// ultratch -> ultratech
const fuzzyMatch = (text, query) => {
  const normalizedText =
    normalizeSearchText(text);

  const normalizedQuery =
    normalizeSearchText(query);

  if (!normalizedQuery) {
    return true;
  }


  // Exact / partial match first
  if (
    normalizedText.includes(
      normalizedQuery
    )
  ) {
    return true;
  }


  // Fuzzy sequence match
  let queryIndex = 0;

  for (
    let i = 0;
    i < normalizedText.length;
    i++
  ) {
    if (
      normalizedText[i] ===
      normalizedQuery[queryIndex]
    ) {
      queryIndex++;
    }

    if (
      queryIndex ===
      normalizedQuery.length
    ) {
      return true;
    }
  }

  return false;
};


// ==========================================
// FILTER PRODUCTS
// ==========================================

const filteredProducts =
  useMemo(() => {

    const searchValue =
      search.trim();


    return products.filter(
      (product) => {

        // CATEGORY FILTER
        const matchesCategory =
          selectedCategory === "All" ||
          product.category ===
            selectedCategory;


        // SEARCH FILTER
        const matchesSearch =
          !searchValue ||
          fuzzyMatch(
            product.name,
            searchValue
          ) ||
          fuzzyMatch(
            product.productCode,
            searchValue
          ) ||
          fuzzyMatch(
            product.barcode,
            searchValue
          ) ||
          fuzzyMatch(
            product.brand,
            searchValue
          ) ||
          fuzzyMatch(
            product.category,
            searchValue
          );


        return (
          matchesCategory &&
          matchesSearch
        );
      }
    );

  }, [
    products,
    search,
    selectedCategory,
  ]);
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
  // DATE / TIME
  // ==========================================

  const currentDateTime =
    new Intl.DateTimeFormat(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(new Date());


  // ==========================================
  // ADD PRODUCT TO CART
  // ==========================================

  const addToCart = (product) => {
    if (
      Number(product.stock) <= 0
    ) {
      setError(
        "This product is out of stock."
      );

      return;
    }

    setError("");

    setCart((previousCart) => {
      const existingItem =
        previousCart.find(
          (item) =>
            item.productId ===
            product._id
        );

      if (existingItem) {
        if (
          existingItem.quantity >=
          Number(product.stock)
        ) {
          return previousCart;
        }

        return previousCart.map(
          (item) =>
            item.productId ===
            product._id
              ? {
                  ...item,
                  quantity:
                    item.quantity +
                    1,
                }
              : item
        );
      }

      return [
        ...previousCart,

        {
          productId:
            product._id,

          name:
            product.name,

          productCode:
            product.productCode,

          unit:
            product.unit,

          quantity: 1,

          sellingPrice:
            Number(
              product.sellingPrice ||
                0
            ),

          gst:
            Number(
              product.gst || 0
            ),

          stock:
            Number(
              product.stock || 0
            ),

          image:
            product.image || "",
        },
      ];
    });
  };


  // ==========================================
  // INCREASE QUANTITY
  // ==========================================

  const increaseQuantity = (
    productId
  ) => {
    setCart((previousCart) =>
      previousCart.map(
        (item) => {
          if (
            item.productId !==
            productId
          ) {
            return item;
          }

          if (
            item.quantity >=
            item.stock
          ) {
            return item;
          }

          return {
            ...item,
            quantity:
              item.quantity + 1,
          };
        }
      )
    );
  };


  // ==========================================
  // DECREASE QUANTITY
  // ==========================================

  const decreaseQuantity = (
    productId
  ) => {
    setCart((previousCart) =>
      previousCart
        .map((item) => {
          if (
            item.productId !==
            productId
          ) {
            return item;
          }

          return {
            ...item,
            quantity:
              item.quantity - 1,
          };
        })
        .filter(
          (item) =>
            item.quantity > 0
        )
    );
  };


  // ==========================================
  // TOTAL ITEM COUNT
  // ==========================================

  const totalItems =
    cart.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );


  // ==========================================
  // BILL TOTAL
  // ==========================================

 const totals =
  useMemo(() => {

    let subtotal = 0;
    let gstAmount = 0;

    cart.forEach(
      (item) => {

        const taxable =
          item.sellingPrice *
          item.quantity;

        const gst =
          settings.showGST
            ? taxable *
              (item.gst / 100)
            : 0;

        subtotal += taxable;
        gstAmount += gst;
      }
    );

    return {
      subtotal,
      gstAmount,

      grandTotal:
        subtotal +
        gstAmount,
    };

  }, [
    cart,
    settings.showGST,
  ]);


  // ==========================================
  // SCAN BUTTON
  // ==========================================

  const handleScanButton = () => {
    searchInputRef.current?.focus();
  };


  // ==========================================
  // PROCEED TO PAYMENT
  // ==========================================

  const proceedToPayment = () => {
    if (cart.length === 0) {
      setError(
        "Add at least one product to the bill."
      );

      return;
    }

    setError("");

    navigate(
      "/payment",
      {
        state: {
          cart,
          totals,
        },
      }
    );
  };


  // ==========================================
  // SHOP INITIAL
  // ==========================================

  const shopInitial =
    settings.shopName
      ?.trim()
      ?.charAt(0)
      ?.toUpperCase() || "";


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="billing-loading-page">

        <div className="billing-loading-text">
          Loading products...
        </div>

      </div>
    );
  }


  // ==========================================
  // JSX
  // ==========================================

  return (
    <div className="billing-page">


      {/* =====================================
          HEADER
      ===================================== */}

      <header className="billing-header">

        <div className="billing-brand">

          <div className="billing-brand-logo">

            {settings.logo ? (

              <img
                src={settings.logo}
                alt={settings.shopName}
                className="billing-brand-logo-image"
              />

            ) : (

              <span className="billing-brand-logo-letter">
                {shopInitial}
              </span>

            )}

          </div>


          <div className="billing-brand-info">

            <h2 className="billing-brand-name">
              {settings.shopName}
            </h2>

            <span className="billing-brand-type">
              POS
            </span>

          </div>

        </div>


        <div className="billing-header-actions">

          <button
            type="button"
            className="billing-notification-button"
            onClick={() =>
              navigate(
                "/notifications"
              )
            }
          >
            <Bell size={22} />
          </button>


          <div className="billing-user-role">

            {storedUser?.role ===
            "owner"
              ? "Owner"
              : "Worker"}

          </div>

        </div>

      </header>


      {/* =====================================
          TITLE
      ===================================== */}

      <section className="billing-title-section">

        <h1 className="billing-page-title">
          New bill
        </h1>


        <button
          type="button"
          className="billing-scan-button"
          onClick={
            handleScanButton
          }
        >

          <ScanLine size={20} />

          <span>
            Scan
          </span>

        </button>

      </section>


      {/* =====================================
          DRAFT INFO
      ===================================== */}

      <section className="billing-draft-section">

        <div className="billing-draft-info">

          <h2 className="billing-draft-title">
            New invoice
          </h2>


          <p className="billing-draft-meta">

            {currentDateTime}


            {storedUser?.name && (
              <>
                {" · "}
                {storedUser.name}
              </>
            )}

          </p>

        </div>


        <span className="billing-draft-badge">
          DRAFT
        </span>

      </section>


      {/* =====================================
          SEARCH
      ===================================== */}

      <section className="billing-search-section">

        <div className="billing-search-box">

          <Search
            size={21}
            className="billing-search-icon"
          />


          <input
            ref={searchInputRef}
            type="text"
            className="billing-search-input"
            placeholder="Search products, SKU or barcode"
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />


          <SlidersHorizontal
            size={20}
            className="billing-search-filter-icon"
          />

        </div>

      </section>


      {/* =====================================
          CATEGORIES
      ===================================== */}

      <section className="billing-category-section">

        <div className="billing-category-scroll">

          {categories.map(
            (category) => (

              <button
                type="button"
                key={category}
                className={`billing-category-button ${
                  selectedCategory ===
                  category
                    ? "billing-category-active"
                    : ""
                }`}
                onClick={() =>
                  setSelectedCategory(
                    category
                  )
                }
              >

                {category}

              </button>

            )
          )}

        </div>

      </section>


      {/* =====================================
          ERROR
      ===================================== */}

      {error && (

        <div className="billing-error-message">
          {error}
        </div>

      )}


      {/* =====================================
          BILL ITEMS
      ===================================== */}

      <section className="billing-cart-section">

        <div className="billing-section-header">

          <h2 className="billing-section-title">
            Bill items
          </h2>


          <span className="billing-cart-count">

            {totalItems}{" "}

            {totalItems === 1
              ? "item"
              : "items"}

            <ChevronRight
              size={18}
            />

          </span>

        </div>


        {cart.length === 0 ? (

          <div className="billing-empty-cart">

            <ReceiptEmptyIcon />

            <h3 className="billing-empty-cart-title">
              No items added
            </h3>

            <p className="billing-empty-cart-text">
              Select a product below to start billing.
            </p>

          </div>

        ) : (

          <div className="billing-cart-card">

            {cart.map(
              (item) => (

                <div
                  className="billing-cart-item"
                  key={
                    item.productId
                  }
                >


                  {/* PRODUCT IMAGE */}

                  <div className="billing-cart-product-image">

                    {item.image ? (

                      <img
                        src={
                          item.image
                        }
                        alt={
                          item.name
                        }
                        className="billing-cart-product-image-file"
                      />

                    ) : (

                      <span className="billing-cart-product-letter">

                        {item.name
                          ?.charAt(0)
                          ?.toUpperCase()}

                      </span>

                    )}

                  </div>


                  {/* PRODUCT INFO */}

                  <div className="billing-cart-product-content">

                    <div className="billing-cart-product-top">

                      <div className="billing-cart-product-info">

                        <h3 className="billing-cart-product-name">
                          {item.name}
                        </h3>


                        <p className="billing-cart-product-meta">

                          {item.productCode}


                          {item.unit && (
                            <>
                              {" · "}
                              {item.unit}
                            </>
                          )}


                         {settings.showGST && (
  <>
    {" · GST "}
    {item.gst}%
  </>
)}

                        </p>

                      </div>


                      <strong className="billing-cart-product-price">

                        {formatCurrency(
                          item.sellingPrice
                        )}

                      </strong>

                    </div>


                    {/* QUANTITY */}

                    <div className="billing-cart-quantity">

                      <button
                        type="button"
                        className="billing-cart-minus-button"
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


                      <span className="billing-cart-quantity-value">
                        {item.quantity}
                      </span>


                      <button
                        type="button"
                        className="billing-cart-plus-button"
                        disabled={
                          item.quantity >=
                          item.stock
                        }
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

                </div>

              )
            )}

          </div>

        )}

      </section>


      {/* =====================================
          PRODUCTS
      ===================================== */}

      <section className="billing-products-section">

        <h2 className="billing-section-title">
          Products
        </h2>


        {filteredProducts.length ===
        0 ? (

          <div className="billing-no-products">
            No products found.
          </div>

        ) : (

          <div className="billing-products-grid">

            {filteredProducts.map(
              (product) => {

                const outOfStock =
                  Number(
                    product.stock
                  ) <= 0;


                const lowStock =
                  Number(
                    product.stock
                  ) <=
                  Number(
                    product.minimumStock ||
                      0
                  );


                return (

                  <button
                    type="button"
                    className="billing-product-card"
                    key={
                      product._id
                    }
                    disabled={
                      outOfStock
                    }
                    onClick={() =>
                      addToCart(
                        product
                      )
                    }
                  >


                    {/* IMAGE */}

                    <div className="billing-product-image-area">

                      {product.image ? (

                        <img
                          src={
                            product.image
                          }
                          alt={
                            product.name
                          }
                          className="billing-product-image"
                        />

                      ) : (

                        <Wrench
                          size={28}
                          className="billing-product-placeholder-icon"
                        />

                      )}

                    </div>


                    {/* PRODUCT DETAILS */}

                    <div className="billing-product-content">

                      <h3 className="billing-product-name">
                        {product.name}
                      </h3>


                      <p className="billing-product-price">

                        {formatCurrency(
                          product.sellingPrice
                        )}


                        {product.unit && (
                          <>
                            {" / "}
                            {product.unit}
                          </>
                        )}

                      </p>


                      <p
                        className={`billing-product-stock ${
                          outOfStock
                            ? "billing-product-out-stock"
                            : lowStock
                              ? "billing-product-low-stock"
                              : "billing-product-in-stock"
                        }`}
                      >

                        {outOfStock
                          ? "Out of stock"
                          : `${product.stock} ${product.unit || ""} left`}

                      </p>

                    </div>

                  </button>

                );
              }
            )}

          </div>

        )}

      </section>


      {/* =====================================
          PAYMENT BAR
      ===================================== */}

      {cart.length > 0 && (

        <div className="billing-payment-bar">

          <div className="billing-payment-total">

            <span className="billing-payment-total-label">
              Grand total
            </span>


            <strong className="billing-payment-total-value">

              {formatCurrency(
                totals.grandTotal
              )}

            </strong>

          </div>


          <button
            type="button"
            className="billing-proceed-button"
            onClick={
              proceedToPayment
            }
          >

            <ArrowRight
              size={21}
            />

            <span>
              Proceed to payment
            </span>

          </button>

        </div>

      )}


      {/* =====================================
          OWNER BOTTOM NAVIGATION
      ===================================== */}

      <OwnerBottomNav />


    </div>
  );
};


// ==========================================
// EMPTY CART ICON
// ==========================================

const ReceiptEmptyIcon = () => {
  return (
    <div className="billing-empty-cart-icon">

      <Wrench size={28} />

    </div>
  );
};


export default Billing;