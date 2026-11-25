import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Users,
  UserPlus,
  Search,
  Phone,
  AtSign,
  ShieldCheck,
  ShieldOff,
  X,
  Loader2,
  RefreshCw,
  Power,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import OwnerBottomNav from "../components/OwnerBottomnav";
import "../styles/worker.css";

const API_URL = import.meta.env.VITE_API_URL 

function Workers() {
  const navigate = useNavigate();

  const [workers, setWorkers] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingWorker, setUpdatingWorker] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    username: "",
    password: "",
  });

  const [error, setError] = useState("");

  // Authentication headers
  const config = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  // Fetch workers
  const fetchWorkers = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await axios.get(
        `${API_URL}/api/workers`,
        config()
      );

      setWorkers(response.data.workers || []);
    } catch (err) {
      console.error("Error fetching workers:", err);

      const message =
        err.response?.data?.message || "Failed to load workers.";

      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  // Form input handler
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      username: "",
      password: "",
    });

    setError("");
  };

  // Add worker
  const handleAddWorker = async (e) => {
    e.preventDefault();

    setError("");

    if (
      !formData.name.trim() ||
      !formData.phone.trim() ||
      !formData.username.trim() ||
      !formData.password
    ) {
      setError("Please fill all the fields.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    try {
      setSubmitting(true);

      await axios.post(
        `${API_URL}/api/workers`,
        {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          username: formData.username.trim(),
          password: formData.password,
        },
        config()
      );

      alert("Worker added successfully!");

      resetForm();
      setShowAddModal(false);

      await fetchWorkers(true);
    } catch (err) {
      console.error("Error adding worker:", err);

      setError(
        err.response?.data?.message || "Failed to add worker."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Activate / Deactivate worker
  const handleToggleStatus = async (worker) => {
    const action = worker.isActive ? "deactivate" : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${worker.name}?`
    );

    if (!confirmed) return;

    try {
      setUpdatingWorker(worker._id);

      await axios.patch(
        `${API_URL}/api/workers/${worker._id}/status`,
        {},
        config()
      );

      alert(`Worker ${action}d successfully!`);

      await fetchWorkers(true);
    } catch (err) {
      console.error("Error updating worker status:", err);

      alert(
        err.response?.data?.message ||
          "Failed to update worker status."
      );
    } finally {
      setUpdatingWorker(null);
    }
  };

  // Search workers
  const filteredWorkers = workers.filter((worker) => {
    const searchValue = search.toLowerCase();

    return (
      worker.name?.toLowerCase().includes(searchValue) ||
      worker.username?.toLowerCase().includes(searchValue) ||
      worker.phone?.toLowerCase().includes(searchValue)
    );
  });

  // Summary counts
  const totalWorkers = workers.length;

  const activeWorkers = workers.filter(
    (worker) => worker.isActive
  ).length;

  const inactiveWorkers = totalWorkers - activeWorkers;

  return (
    <div className="workers-page">

      {/* Header */}
      <div className="workers-header">
        <div>
          <h1>Workers</h1>
          <p>Manage your shop workers and their accounts</p>
        </div>

        <button
          type="button"
          className="workers-add-button"
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
        >
          <UserPlus size={18} />
          Add Worker
        </button>
      </div>

      {/* Summary Cards */}
      <div className="workers-summary">

        <div className="workers-summary-card">
          <div className="workers-summary-icon">
            <Users size={22} />
          </div>

          <div>
            <p>Total Workers</p>
            <h2>{totalWorkers}</h2>
          </div>
        </div>

        <div className="workers-summary-card">
          <div className="workers-summary-icon workers-active-icon">
            <ShieldCheck size={22} />
          </div>

          <div>
            <p>Active Workers</p>
            <h2>{activeWorkers}</h2>
          </div>
        </div>

        <div className="workers-summary-card">
          <div className="workers-summary-icon workers-inactive-icon">
            <ShieldOff size={22} />
          </div>

          <div>
            <p>Inactive Workers</p>
            <h2>{inactiveWorkers}</h2>
          </div>
        </div>

      </div>

      {/* Worker List Header */}
      <div className="workers-list-header">
        <div>
          <h2>All Workers</h2>
          <p>View and manage registered workers</p>
        </div>

        <button
          type="button"
          className="workers-refresh-button"
          onClick={() => fetchWorkers(true)}
          disabled={refreshing}
          title="Refresh workers"
        >
          <RefreshCw
            size={18}
            className={refreshing ? "workers-spinning" : ""}
          />
        </button>
      </div>

      {/* Search */}
      <div className="workers-search-box">
        <Search size={19} />

        <input
          type="text"
          placeholder="Search by name, username or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Worker List */}
      {loading ? (
        <div className="workers-loading">
          <Loader2 size={28} className="workers-spinning" />
          <p>Loading workers...</p>
        </div>
      ) : error && workers.length === 0 ? (
        <div className="workers-empty">
          <p>{error}</p>

          <button
            type="button"
            onClick={() => fetchWorkers()}
          >
            Try Again
          </button>
        </div>
      ) : filteredWorkers.length === 0 ? (
        <div className="workers-empty">
          <Users size={38} />
          <h3>No workers found</h3>
          <p>
            {search
              ? "Try searching with another name or username."
              : "Add your first worker to get started."}
          </p>
        </div>
      ) : (
        <div className="workers-list">

          {filteredWorkers.map((worker) => (
            <div
              className="workers-member-card"
              key={worker._id}
            >

              {/* Worker Information */}
              <div className="workers-member-top">

                <div className="workers-member-avatar">
                  {worker.name?.charAt(0)?.toUpperCase() || "W"}
                </div>

                <div className="workers-member-info">
                  <h3>{worker.name}</h3>

                  <span
                    className={`workers-status ${
                      worker.isActive
                        ? "workers-status-active"
                        : "workers-status-inactive"
                    }`}
                  >
                    {worker.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

              </div>

              {/* Worker Details */}
              <div className="workers-member-details">

                <div>
                  <AtSign size={16} />
                  <span>{worker.username || "No username"}</span>
                </div>

                <div>
                  <Phone size={16} />
                  <span>{worker.phone || "No phone number"}</span>
                </div>

              </div>

              {/* Activate / Deactivate */}
              <button
                type="button"
                className={
                  worker.isActive
                    ? "workers-deactivate-button"
                    : "workers-activate-button"
                }
                onClick={() => handleToggleStatus(worker)}
                disabled={updatingWorker === worker._id}
              >
                {updatingWorker === worker._id ? (
                  <Loader2
                    size={17}
                    className="workers-spinning"
                  />
                ) : (
                  <Power size={17} />
                )}

                {updatingWorker === worker._id
                  ? "Updating..."
                  : worker.isActive
                  ? "Deactivate Worker"
                  : "Activate Worker"}
              </button>

            </div>
          ))}

        </div>
      )}

      {/* Add Worker Modal */}
      {showAddModal && (
        <div
          className="workers-modal-overlay"
          onClick={() => {
            if (!submitting) {
              setShowAddModal(false);
              resetForm();
            }
          }}
        >

          <div
            className="workers-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="workers-modal-header">
              <div>
                <h2>Add New Worker</h2>
                <p>Create a login account for your worker</p>
              </div>

              <button
                type="button"
                className="workers-modal-close"
                onClick={() => {
                  if (!submitting) {
                    setShowAddModal(false);
                    resetForm();
                  }
                }}
                disabled={submitting}
              >
                <X size={21} />
              </button>
            </div>

            <form
              className="workers-form"
              onSubmit={handleAddWorker}
            >

              {/* Name */}
              <div className="workers-form-group">
                <label>Worker Name</label>

                <input
                  type="text"
                  name="name"
                  placeholder="Enter worker name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Phone */}
              <div className="workers-form-group">
                <label>Phone Number</label>

                <input
                  type="tel"
                  name="phone"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Username */}
              <div className="workers-form-group">
                <label>Username</label>

                <input
                  type="text"
                  name="username"
                  placeholder="Create login username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Password */}
              <div className="workers-form-group">
                <label>Password</label>

                <input
                  type="password"
                  name="password"
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  minLength={6}
                  required
                />
              </div>

              {/* Error */}
              {error && (
                <div className="workers-form-error">
                  {error}
                </div>
              )}

              {/* Buttons */}
              <div className="workers-form-actions">

                <button
                  type="button"
                  className="workers-cancel-button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="workers-submit-button"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2
                        size={17}
                        className="workers-spinning"
                      />
                      Adding...
                    </>
                  ) : (
                    <>
                      <UserPlus size={17} />
                      Add Worker
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      <OwnerBottomNav />

    </div>
  );
}

export default Workers;