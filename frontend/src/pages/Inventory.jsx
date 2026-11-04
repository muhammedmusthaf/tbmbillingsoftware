import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";

import {
  Search,
  SlidersHorizontal,
  Plus,
  Package,
  ChevronRight,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import "../styles/inventory.css";

import OwnerBottomNav from "../components/OwnerBottomnav";


const Inventory = () => {
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

  const [search, setSearch] =
    useState("");

  const [selectedFilter, setSelectedFilter] =
    useState("all");

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
        "INVENTORY LOAD ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load inventory."
      );

    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // LOAD INVENTORY
  // ==========================================

  useEffect(() => {
    fetchProducts();
  }, []);


  // ==========================================
  // STOCK STATUS
  // ==========================================

  const getStockStatus = (product) => {
    const stock =
      Number(product.stock || 0);

    const minimumStock =
      Number(
        product.minimumStock || 0
      );

    if (stock <= 0) {
      return "out";
    }

    if (stock <= minimumStock) {
      return "low";
    }

    return "in";
  };


  // ==========================================
  // FILTER PRODUCTS
  // ==========================================

  const filteredProducts =
    useMemo(() => {
      const searchValue =
        search
          .trim()
          .toLowerCase();

      return products.filter(
        (product) => {
          const status =
            getStockStatus(product);

          // --------------------------
          // STATUS FILTER
          // --------------------------

          let matchesStatus = true;

          if (
            selectedFilter === "in"
          ) {
            matchesStatus =
              status === "in";
          }

          if (
            selectedFilter === "low"
          ) {
            matchesStatus =
              status === "low";
          }

          if (
            selectedFilter === "out"
          ) {
            matchesStatus =
              status === "out";
          }


          // --------------------------
          // SEARCH
          // --------------------------

          const searchableText = [
            product.name,
            product.productCode,
            product.barcode,
            product.brand,
            product.category,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          const matchesSearch =
            !searchValue ||
            searchableText.includes(
              searchValue
            );


          return (
            matchesStatus &&
            matchesSearch
          );
        }
      );

    }, [
      products,
      search,
      selectedFilter,
    ]);


  // ==========================================
  // COUNTS
  // ==========================================

  const stockCounts =
    useMemo(() => {
      let inStock = 0;
      let lowStock = 0;
      let outOfStock = 0;

      products.forEach(
        (product) => {
          const status =
            getStockStatus(product);

          if (status === "in") {
            inStock++;
          }

          if (status === "low") {
            lowStock++;
          }

          if (status === "out") {
            outOfStock++;
          }
        }
      );

      return {
        total: products.length,
        inStock,
        lowStock,
        outOfStock,
      };

    }, [products]);


  // ==========================================
  // UNIT LABEL
  // ==========================================

  const formatUnit = (
    unit = "",
    quantity = 0
  ) => {
    if (!unit) {
      return "";
    }

    const unitNames = {
      piece: "Pieces",
      box: "Boxes",
      bag: "Bags",
      kg: "Kg",
      gram: "Grams",
      litre: "Litres",
      metre: "Metres",
      feet: "Feet",
      bundle: "Bundles",
      packet: "Packets",
    };

    if (
      Number(quantity) === 1
    ) {
      const singularNames = {
        piece: "Piece",
        box: "Box",
        bag: "Bag",
        kg: "Kg",
        gram: "Gram",
        litre: "Litre",
        metre: "Metre",
        feet: "Feet",
        bundle: "Bundle",
        packet: "Packet",
      };

      return (
        singularNames[unit] ||
        unit
      );
    }

    return (
      unitNames[unit] ||
      unit
    );
  };


  // ==========================================
  // STOCK STATUS LABEL
  // ==========================================

  const getStatusLabel = (
    status
  ) => {
    if (status === "low") {
      return "LOW";
    }

    if (status === "out") {
      return "OUT";
    }

    return "IN STOCK";
  };


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="inventory-loading-page">

        <div className="inventory-loading-text">
          Loading inventory...
        </div>

      </div>
    );
  }


  // ==========================================
  // JSX
  // ==========================================

  return (
    <div className="inventory-page">


      {/* =====================================
          HEADER
      ===================================== */}

      <header className="inventory-header">

        <h1 className="inventory-title">
          Inventory
        </h1>

      </header>


      {/* =====================================
          INVENTORY SUMMARY
      ===================================== */}

      <section className="inventory-summary-section">

        <div className="inventory-summary-info">

          <strong className="inventory-total-count">
            {stockCounts.total}
          </strong>

          <span className="inventory-total-label">
            SKUs in catalogue
          </span>

        </div>


        <div className="inventory-summary-actions">

  <button
    type="button"
    className="inventory-add-product-button"
    onClick={() =>
      navigate("/products/add")
    }
  >
    <Plus size={22} />
    <span>Add product</span>
  </button>

  <button
    type="button"
    className="inventory-stock-in-button"
    onClick={() =>
      navigate("/stock-in")
    }
  >
    <Plus size={22} />
    <span>Stock in</span>
  </button>

</div>

      </section>


      {/* =====================================
          SEARCH
      ===================================== */}

      <section className="inventory-search-section">

        <div className="inventory-search-box">

          <Search
            size={22}
            className="inventory-search-icon"
          />

          <input
            type="text"
            className="inventory-search-input"
            placeholder="Search inventory or SKU"
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

          <button
            type="button"
            className="inventory-filter-icon-button"
          >
            <SlidersHorizontal
              size={21}
            />
          </button>

        </div>

      </section>


      {/* =====================================
          FILTER TABS
      ===================================== */}

      <section className="inventory-filter-section">

        <div className="inventory-filter-scroll">


          <button
            type="button"
            className={`inventory-filter-button ${
              selectedFilter === "all"
                ? "inventory-filter-active"
                : ""
            }`}
            onClick={() =>
              setSelectedFilter(
                "all"
              )
            }
          >
            All
          </button>


          <button
            type="button"
            className={`inventory-filter-button ${
              selectedFilter === "in"
                ? "inventory-filter-active"
                : ""
            }`}
            onClick={() =>
              setSelectedFilter(
                "in"
              )
            }
          >
            In stock
          </button>


          <button
            type="button"
            className={`inventory-filter-button ${
              selectedFilter === "low"
                ? "inventory-filter-active"
                : ""
            }`}
            onClick={() =>
              setSelectedFilter(
                "low"
              )
            }
          >
            Low stock
          </button>


          <button
            type="button"
            className={`inventory-filter-button ${
              selectedFilter === "out"
                ? "inventory-filter-active"
                : ""
            }`}
            onClick={() =>
              setSelectedFilter(
                "out"
              )
            }
          >
            Out of stock
          </button>

        </div>

      </section>


      {/* =====================================
          ERROR
      ===================================== */}

      {error && (

        <div className="inventory-error-message">
          {error}
        </div>

      )}


      {/* =====================================
          STOCK LEVEL TITLE
      ===================================== */}

      <section className="inventory-stock-heading">

        <h2 className="inventory-stock-title">
          Stock levels
        </h2>


        <button
          type="button"
          className="inventory-adjust-button"
          onClick={() =>
            navigate("/stock-in")
          }
        >

          <span>
            Adjust
          </span>

          <ChevronRight size={18} />

        </button>

      </section>


      {/* =====================================
          STOCK LIST
      ===================================== */}

      <section className="inventory-stock-section">


        {filteredProducts.length === 0 ? (

          <div className="inventory-empty-state">

            <Package size={38} />

            <h3>
              No products found
            </h3>

            <p>
              No inventory items match your search or filter.
            </p>

          </div>

        ) : (

          <div className="inventory-stock-list">


            {filteredProducts.map(
              (product) => {

                const status =
                  getStockStatus(
                    product
                  );

                const stock =
                  Number(
                    product.stock || 0
                  );

                const minimumStock =
                  Number(
                    product.minimumStock ||
                      0
                  );


                return (

                  <div
                    className={`inventory-stock-card inventory-stock-${status}`}
                    key={product._id}
                  >


                    {/* PRODUCT IMAGE */}

                    <div className="inventory-product-image-box">

                      {product.image ? (

                        <img
                          src={product.image}
                          alt={product.name}
                          className="inventory-product-image"
                        />

                      ) : (

                        <Package
                          size={25}
                          className="inventory-product-placeholder"
                        />

                      )}

                    </div>


                    {/* PRODUCT DETAILS */}

                    <div className="inventory-product-details">

                      <h3 className="inventory-product-name">
                        {product.name}
                      </h3>


                      <p className="inventory-product-meta">

                        {product.productCode}

                        {minimumStock > 0 && (
                          <>
                            {" · Min "}
                            {minimumStock}{" "}
                            {formatUnit(
                              product.unit,
                              minimumStock
                            )}
                          </>
                        )}

                      </p>

                    </div>


                    {/* STOCK */}

                    <div className="inventory-product-stock">

                      <strong className="inventory-product-stock-number">
                        {stock}
                      </strong>


                      <span className="inventory-product-stock-unit">

                        {formatUnit(
                          product.unit,
                          stock
                        )}

                      </span>


                      <span
                        className={`inventory-product-status inventory-product-status-${status}`}
                      >

                        {getStatusLabel(
                          status
                        )}

                      </span>

                    </div>

                  </div>

                );
              }
            )}

          </div>

        )}

      </section>


      {/* =====================================
          OWNER BOTTOM NAV
      ===================================== */}

      <OwnerBottomNav />

    </div>
  );
};

export default Inventory;