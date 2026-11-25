
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Package,
  ArrowLeft,
  Loader2,
  ReceiptText,
  X,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import WorkerBottomnav from "../components/WorkerBottomnav";
import "../styles/workerBilling.css";

const API_URL = import.meta.env.VITE_API_URL 

function WorkerBilling() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [loading, setLoading] = useState(true);
  const [showGST, setShowGST] = useState(false);
  const [showCart, setShowCart] = useState(false);

  const [error, setError] = useState("");

  const config = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  // Fetch products and billing settings
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [productResponse, settingsResponse] =
        await Promise.all([
          axios.get(`${API_URL}/api/products`, config()),
          axios.get(`${API_URL}/api/settings`, config()),
        ]);

      const productData = productResponse.data;

      setProducts(
        Array.isArray(productData)
          ? productData
          : productData.products || productData.data || []
      );

      const settings =
        settingsResponse.data.settings ||
        settingsResponse.data;

      setShowGST(settings.showGST === true);
    } catch (err) {
      console.error("Worker billing fetch error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load products or billing settings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Categories
  const categories = useMemo(() => {
    return [
      "All",
      ...new Set(
        products
          .map((product) => product.category)
          .filter(Boolean)
      ),
    ];
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    const value = search.toLowerCase().trim();

    return products.filter((product) => {
      const matchesSearch =
        product.name?.toLowerCase().includes(value) ||
        product.productCode?.toLowerCase().includes(value) ||
        product.brand?.toLowerCase().includes(value);

      const matchesCategory =
        category === "All" ||
        product.category === category;

      return (
        matchesSearch &&
        matchesCategory &&
        product.isActive !== false
      );
    });
  }, [products, search, category]);

  // Add product
  const addToCart = (product) => {
    if (Number(product.stock) <= 0) {
      alert("This product is out of stock.");
      return;
    }

    setCart((prev) => {
      const existing = prev.find(
        (item) => item.productId === product._id
      );

      if (existing) {
        if (existing.quantity >= Number(product.stock)) {
          alert("You cannot add more than available stock.");
          return prev;
        }

        return prev.map((item) =>
          item.productId === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...prev,
        {
          productId: product._id,
          productName: product.name,
          productCode: product.productCode,
          unit: product.unit,
          quantity: 1,
          sellingPrice: Number(product.sellingPrice || 0),
          gst: Number(product.gst || 0),
          stock: Number(product.stock || 0),
        },
      ];
    });
  };

  // Change quantity
  const updateQuantity = (productId, change) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item;

          const nextQuantity = item.quantity + change;

          if (nextQuantity <= 0) return null;

          if (nextQuantity > item.stock) {
            alert("Available stock limit reached.");
            return item;
          }

          return {
            ...item,
            quantity: nextQuantity,
          };
        })
        .filter(Boolean)
    );
  };

  // Direct quantity input
  const handleQuantityInput = (productId, value) => {
    const quantity = Number(value);

    if (!Number.isInteger(quantity) || quantity < 1) {
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;

        if (quantity > item.stock) {
          return item;
        }

        return {
          ...item,
          quantity,
        };
      })
    );
  };

  // Update selling price if needed
  const handlePriceChange = (productId, value) => {
    const price = Number(value);

    if (!Number.isFinite(price) || price < 0) return;

    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, sellingPrice: price }
          : item
      )
    );
  };

  // Remove product
  const removeFromCart = (productId) => {
    setCart((prev) =>
      prev.filter((item) => item.productId !== productId)
    );
  };

  // Calculate subtotal
  const subtotal = cart.reduce(
    (total, item) =>
      total + item.quantity * item.sellingPrice,
    0
  );

  // Calculate GST only when enabled
  const gstAmount = showGST
    ? cart.reduce((total, item) => {
        const itemAmount =
          item.quantity * item.sellingPrice;

        return total + (itemAmount * item.gst) / 100;
      }, 0)
    : 0;

  const grandTotal = subtotal + gstAmount;

  const totalItems = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  // Currency
  const formatCurrency = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // Continue to payment
  const handleContinue = () => {
    if (cart.length === 0) {
      alert("Please add products to the cart.");
      return;
    }

    navigate("/worker/payment", {
      state: {
        cart,
        totals: {
          subtotal: Number(subtotal.toFixed(2)),
          gstAmount: Number(gstAmount.toFixed(2)),
          grandTotal: Number(grandTotal.toFixed(2)),
          totalItems,
          showGST,
        },
      },
    });
  };

  return (
    <div className="worker-billing-page">

      {/* Header */}
      <div className="worker-billing-header">
        <div>
          <h1>New Bill</h1>
          <p>Create a customer invoice</p>
        </div>

        <button
          type="button"
          className="worker-billing-cart-button"
          onClick={() => setShowCart(true)}
        >
          <ShoppingCart size={21} />
          <span>{totalItems}</span>
        </button>
      </div>

      {/* Search */}
      <div className="worker-billing-search">
        <Search size={20} />

        <input
          type="text"
          placeholder="Search product name, code or brand..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Categories */}
      <div className="worker-billing-categories">
        {categories.map((item) => (
          <button
            type="button"
            key={item}
            className={
              category === item
                ? "worker-billing-category-active"
                : "worker-billing-category"
            }
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {/* GST Status */}
      <div className="worker-billing-gst-info">
        <ReceiptText size={17} />

        <span>
          GST calculation is{" "}
          <strong>{showGST ? "enabled" : "disabled"}</strong>
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="worker-billing-error">
          {error}
          <button type="button" onClick={fetchData}>
            Retry
          </button>
        </div>
      )}

      {/* Product List */}
      <div className="worker-billing-section-heading">
        <div>
          <h2>Products</h2>
          <p>{filteredProducts.length} products available</p>
        </div>
      </div>

      {loading ? (
        <div className="worker-billing-loading">
          <Loader2
            size={28}
            className="worker-billing-spin"
          />
          <p>Loading products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="worker-billing-empty">
          <Package size={40} />
          <h3>No products found</h3>
          <p>Try another search or category.</p>
        </div>
      ) : (
        <div className="worker-billing-product-list">

          {filteredProducts.map((product) => {
            const cartItem = cart.find(
              (item) => item.productId === product._id
            );

            const stock = Number(product.stock || 0);

            return (
              <div
                className="worker-billing-product-card"
                key={product._id}
              >

                <div className="worker-billing-product-info">
                  <div className="worker-billing-product-icon">
                    <Package size={22} />
                  </div>

                  <div>
                    <h3>{product.name}</h3>

                    <p>
                      {product.productCode || "No product code"}
                      {product.brand
                        ? ` • ${product.brand}`
                        : ""}
                    </p>

                    <span>
                      Stock: {stock} {product.unit}
                    </span>
                  </div>
                </div>

                <div className="worker-billing-product-action">
                  <div>
                    <strong>
                      {formatCurrency(product.sellingPrice)}
                    </strong>

                    <small>
                      {showGST
                        ? `${product.gst || 0}% GST`
                        : "GST excluded"}
                    </small>
                  </div>

                  <button
                    type="button"
                    onClick={() => addToCart(product)}
                    disabled={stock <= 0}
                  >
                    <Plus size={17} />
                    {cartItem ? "Add More" : "Add"}
                  </button>
                </div>

                {stock <= 0 && (
                  <span className="worker-billing-out-stock">
                    Out of stock
                  </span>
                )}

              </div>
            );
          })}

        </div>
      )}

      {/* Cart Summary */}
      <div className="worker-billing-bottom-summary">
        <div>
          <span>{totalItems} items in cart</span>
          <strong>{formatCurrency(grandTotal)}</strong>
        </div>

        <button
          type="button"
          onClick={() => setShowCart(true)}
          disabled={cart.length === 0}
        >
          View Cart
          <ShoppingCart size={18} />
        </button>
      </div>

      {/* Cart Modal */}
      {showCart && (
        <div
          className="worker-billing-modal-overlay"
          onClick={() => setShowCart(false)}
        >
          <div
            className="worker-billing-cart-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="worker-billing-modal-header">
              <div>
                <h2>Billing Cart</h2>
                <p>{totalItems} items selected</p>
              </div>

              <button
                type="button"
                onClick={() => setShowCart(false)}
              >
                <X size={21} />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="worker-billing-empty">
                <ShoppingCart size={40} />
                <h3>Your cart is empty</h3>
                <p>Add products to continue billing.</p>
              </div>
            ) : (
              <>
                <div className="worker-billing-cart-items">

                  {cart.map((item) => (
                    <div
                      className="worker-billing-cart-item"
                      key={item.productId}
                    >

                      <div className="worker-billing-cart-item-info">
                        <h3>{item.productName}</h3>
                        <p>{item.productCode}</p>

                        <label>
                          Rate (₹)
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.sellingPrice}
                            onChange={(e) =>
                              handlePriceChange(
                                item.productId,
                                e.target.value
                              )
                            }
                          />
                        </label>
                      </div>

                      <div className="worker-billing-cart-item-actions">

                        <div className="worker-billing-quantity-control">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.productId, -1)
                            }
                          >
                            <Minus size={15} />
                          </button>

                          <input
                            type="number"
                            min="1"
                            max={item.stock}
                            value={item.quantity}
                            onChange={(e) =>
                              handleQuantityInput(
                                item.productId,
                                e.target.value
                              )
                            }
                          />

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.productId, 1)
                            }
                          >
                            <Plus size={15} />
                          </button>
                        </div>

                        <strong>
                          {formatCurrency(
                            item.quantity * item.sellingPrice
                          )}
                        </strong>

                        <button
                          type="button"
                          className="worker-billing-remove-button"
                          onClick={() =>
                            removeFromCart(item.productId)
                          }
                          title="Remove product"
                        >
                          <Trash2 size={17} />
                        </button>

                      </div>

                    </div>
                  ))}

                </div>

                {/* Total */}
                <div className="worker-billing-total-section">

                  <div>
                    <span>Subtotal</span>
                    <strong>{formatCurrency(subtotal)}</strong>
                  </div>

                  {showGST && (
                    <div>
                      <span>GST</span>
                      <strong>{formatCurrency(gstAmount)}</strong>
                    </div>
                  )}

                  <div className="worker-billing-grand-total">
                    <span>Grand Total</span>
                    <strong>{formatCurrency(grandTotal)}</strong>
                  </div>

                </div>

                <button
                  type="button"
                  className="worker-billing-continue-button"
                  onClick={handleContinue}
                >
                  Continue to Payment
                  <ArrowLeft size={18} />
                </button>
              </>
            )}

          </div>
        </div>
      )}

      <WorkerBottomnav />
    </div>
  );
}

export default WorkerBilling;
