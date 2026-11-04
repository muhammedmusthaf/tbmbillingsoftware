
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ArrowLeft,
  UsersRound,
  UserPlus,
  Search,
  Phone,
  ShieldCheck,
  UserRound,
  RefreshCw,
  X,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import "../styles/workers.css";
import OwnerBottomNav from "../components/OwnerBottomnav";

const API_URL = import.meta.env.VITE_API_URL;

const Workers = () => {
  const navigate = useNavigate();

  const [workers, setWorkers] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
  });

  const config = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  // ==========================================
  // FETCH WORKERS
  // ==========================================

  const fetchWorkers = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      setError("");

      const response = await axios.get(
        `${API_URL}/api/workers`,
        config()
      );

      const data = response.data;

      const workerList = Array.isArray(data)
        ? data
        : Array.isArray(data.workers)
        ? data.workers
        : Array.isArray(data.users)
        ? data.users
        : null;

      if (!workerList) {
        throw new Error(
          "Unexpected workers API response format."
        );
      }

      setWorkers(workerList);
    } catch (err) {
      console.error("WORKERS ERROR:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load workers."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  // ==========================================
  // FILTER WORKERS
  // ==========================================

  const filteredWorkers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return workers.filter((worker) => {
      const searchable = [
        worker.name,
        worker.username,
        worker.phone,
        worker.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return !query || searchable.includes(query);
    });
  }, [workers, search]);

  const activeWorkers = workers.filter(
    (worker) => worker.isActive !== false
  ).length;

  const inactiveWorkers = workers.filter(
    (worker) => worker.isActive === false
  ).length;

  // ==========================================
  // FORM HANDLERS
  // ==========================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      name: "",
      phone: "",
      email: "",
      password: "",
    });

    setShowPassword(false);
    setShowAddForm(false);
  };

  const handleAddWorker = (event) => {
    event.preventDefault();

    // POST /api/workers must be confirmed against
    // your actual worker controller before saving.
    setError(
      "Worker creation is not connected yet. Please confirm the POST /api/workers request fields from your backend."
    );
  };

  // ==========================================
  // JSX
  // ==========================================

  return (
    <div className="workers-page">

      {/* HEADER */}
      <header className="workers-header">
        <button
          type="button"
          className="workers-back-button"
          onClick={() => navigate("/more")}
          aria-label="Go back"
        >
          <ArrowLeft size={23} />
        </button>

        <div className="workers-header-info">
          <h1>Workers</h1>
          <p>Manage staff and billing access</p>
        </div>

        <button
          type="button"
          className="workers-refresh-button"
          onClick={() => fetchWorkers(true)}
          disabled={refreshing}
          aria-label="Refresh workers"
        >
          <RefreshCw size={21} />
        </button>
      </header>

      {/* SUMMARY */}
      <section className="workers-summary-grid">
        <div className="workers-summary-card">
          <div className="workers-summary-icon">
            <UsersRound size={24} />
          </div>

          <span>Total workers</span>
          <strong>{workers.length}</strong>
        </div>

        <div className="workers-summary-card">
          <div className="workers-summary-icon">
            <ShieldCheck size={24} />
          </div>

          <span>Active</span>
          <strong>{activeWorkers}</strong>
        </div>

        <div className="workers-summary-card">
          <div className="workers-summary-icon">
            <UserRound size={24} />
          </div>

          <span>Inactive</span>
          <strong>{inactiveWorkers}</strong>
        </div>
      </section>

      {/* SEARCH */}
      <section className="workers-search-section">
        <div className="workers-search-box">
          <Search size={21} />

          <input
            type="text"
            placeholder="Search workers"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>

      {/* WORKERS HEADING */}
      <section className="workers-list-heading">
        <div>
          <h2>Staff members</h2>
          <p>{filteredWorkers.length} workers found</p>
        </div>

        <button
          type="button"
          className="workers-add-button"
          onClick={() => {
            setError("");
            setShowAddForm(true);
          }}
        >
          <UserPlus size={19} />
          Add worker
        </button>
      </section>

      {/* ERROR */}
      {error && (
        <div className="workers-error-message">
          <AlertCircle size={19} />
          <span>{error}</span>
        </div>
      )}

      {/* WORKERS LIST */}
      <section className="workers-list">
        {loading ? (
          <div className="workers-loading">
            Loading workers...
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div className="workers-empty">
            <UsersRound size={40} />

            <h3>No workers found</h3>

            <p>
              {search
                ? "Try another search."
                : "No worker accounts are available yet."}
            </p>
          </div>
        ) : (
          filteredWorkers.map((worker) => (
            <article
              className="workers-member-card"
              key={worker._id}
            >
              <div className="workers-member-top">
                <div className="workers-member-avatar">
                  {(worker.name || worker.username || "W")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="workers-member-info">
                  <h3>
                    {worker.name ||
                      worker.username ||
                      "Worker"}
                  </h3>

                  <span>
                    {worker.role || "worker"}
                  </span>
                </div>

                <span
                  className={`workers-status ${
                    worker.isActive === false
                      ? "workers-status-inactive"
                      : "workers-status-active"
                  }`}
                >
                  {worker.isActive === false
                    ? "INACTIVE"
                    : "ACTIVE"}
                </span>
              </div>

              <div className="workers-member-details">
                {worker.phone && (
                  <div className="workers-member-detail">
                    <Phone size={17} />
                    <span>{worker.phone}</span>
                  </div>
                )}

                {worker.email && (
                  <div className="workers-member-detail">
                    <span>{worker.email}</span>
                  </div>
                )}

                {worker.username && (
                  <div className="workers-member-detail">
                    <UserRound size={17} />
                    <span>{worker.username}</span>
                  </div>
                )}
              </div>
            </article>
          ))
        )}
      </section>

      {/* ADD WORKER MODAL */}
      {showAddForm && (
        <div className="workers-modal-overlay">
          <div
            className="workers-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="workers-modal-title"
          >
            <div className="workers-modal-header">
              <div>
                <h2 id="workers-modal-title">
                  Add new worker
                </h2>

                <p>Create a staff login account</p>
              </div>

              <button
                type="button"
                className="workers-modal-close"
                onClick={resetForm}
                aria-label="Close"
              >
                <X size={23} />
              </button>
            </div>

            <form
              className="workers-add-form"
              onSubmit={handleAddWorker}
            >
              <div className="workers-form-field">
                <label>Worker name *</label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Full name"
                  required
                />
              </div>

              <div className="workers-form-field">
                <label>Phone number</label>

                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Phone number"
                />
              </div>

              <div className="workers-form-field">
                <label>Email</label>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Worker email"
                />
              </div>

              <div className="workers-form-field">
                <label>Password *</label>

                <div className="workers-password-field">
                  <input
                    type={
                      showPassword ? "text" : "password"
                    }
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Create password"
                    minLength={8}
                    autoComplete="new-password"
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((previous) => !previous)
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>

              <div className="workers-form-role">
                <ShieldCheck size={20} />

                <div>
                  <strong>Worker access</strong>

                  <p>
                    Worker accounts will use the
                    restricted billing interface.
                  </p>
                </div>
              </div>

              <div className="workers-form-actions">
                <button
                  type="button"
                  className="workers-cancel-button"
                  onClick={resetForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="workers-save-button"
                >
                  <UserPlus size={19} />
                  Create worker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <OwnerBottomNav />
    </div>
  );
};

export default Workers;
