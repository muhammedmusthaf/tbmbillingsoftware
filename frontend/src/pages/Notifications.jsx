
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Bell,
  AlertTriangle,
  Package,
  FileText,
  Info,
  RefreshCw,
  Loader2,
  ArrowLeft,
  Inbox,
  CheckCircle2,
  CreditCard,
  RotateCcw,
  CheckCheck,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import OwnerBottomNav from "../components/OwnerBottomnav";
import "../styles/notification.css";

const API_URL = import.meta.env.VITE_API_URL;

function Notifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const config = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  // ==========================================
  // FETCH SAVED NOTIFICATIONS
  // ==========================================
  const fetchNotifications = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await axios.get(
        `${API_URL}/api/notifications/history`,
        config()
      );

      const notificationList = Array.isArray(
        response.data?.notifications
      )
        ? response.data.notifications
        : [];

      setNotifications(notificationList);
    } catch (err) {
      console.error("Notification fetch error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load notifications."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // ==========================================
  // UNREAD COUNT
  // ==========================================
  const unreadCount = notifications.filter(
    (item) => item.isRead === false
  ).length;

  // ==========================================
  // FILTER NOTIFICATIONS
  // ==========================================
  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter(
        (item) => item.isRead === false
      );
    }

    return notifications;
  }, [notifications, filter]);

  // ==========================================
  // MARK ONE AS READ
  // ==========================================
  const markAsRead = async (id) => {
    if (!id) return;

    try {
      setActionLoading(id);

      await axios.patch(
        `${API_URL}/api/notifications/${id}/read`,
        {},
        config()
      );

      setNotifications((prev) =>
        prev.map((item) =>
          item._id === id
            ? { ...item, isRead: true }
            : item
        )
      );
    } catch (err) {
      console.error("Mark as read error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to mark notification as read."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ==========================================
  // MARK ALL AS READ
  // ==========================================
  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    try {
      setActionLoading("all");

      await axios.patch(
        `${API_URL}/api/notifications/read-all`,
        {},
        config()
      );

      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          isRead: true,
        }))
      );
    } catch (err) {
      console.error("Mark all as read error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to mark all notifications as read."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ==========================================
  // NOTIFICATION ICON
  // ==========================================
  const getNotificationIcon = (type) => {
    switch (type) {
      case "low_stock":
      case "out_of_stock":
      case "stock_in":
        return Package;

      case "bill_generated":
        return FileText;

      case "credit_payment":
      case "credit_due":
        return CreditCard;

      case "return_processed":
        return RotateCcw;

      default:
        return Info;
    }
  };

  // ==========================================
  // NOTIFICATION COLOR
  // ==========================================
  const getNotificationClass = (type) => {
    switch (type) {
      case "low_stock":
      case "out_of_stock":
      case "credit_due":
        return "notifications-warning";

      case "stock_in":
        return "notifications-stock";

      case "bill_generated":
        return "notifications-billing";

      default:
        return "notifications-general";
    }
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================
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

  return (
    <div className="notifications-page">

      {/* HEADER */}
      <div className="notifications-header">
        <button
          type="button"
          className="notifications-back-button"
          onClick={() => navigate("/more")}
        >
          <ArrowLeft size={20} />
        </button>

        <div className="notifications-header-content">
          <h1>Notifications</h1>
          <p>Stay updated with your business activities</p>
        </div>

        <button
          type="button"
          className="notifications-refresh-button"
          onClick={() => fetchNotifications(true)}
          disabled={refreshing || loading}
          title="Refresh notifications"
        >
          <RefreshCw
            size={19}
            className={
              refreshing ? "notifications-spinning" : ""
            }
          />
        </button>
      </div>

      {/* SUMMARY */}
      <div className="notifications-summary">
        <div className="notifications-summary-icon">
          <Bell size={24} />
        </div>

        <div>
          <p>Total Notifications</p>
          <h2>{notifications.length}</h2>
        </div>

        <div className="notifications-unread-count">
          <span>{unreadCount}</span>
          <small>Unread</small>
        </div>
      </div>

      {/* FILTERS */}
      <div className="notifications-filter-row">
        <button
          type="button"
          className={
            filter === "all"
              ? "notifications-filter-active"
              : "notifications-filter"
          }
          onClick={() => setFilter("all")}
        >
          All ({notifications.length})
        </button>

        <button
          type="button"
          className={
            filter === "unread"
              ? "notifications-filter-active"
              : "notifications-filter"
          }
          onClick={() => setFilter("unread")}
        >
          Unread ({unreadCount})
        </button>

        {unreadCount > 0 && (
          <button
            type="button"
            className="notifications-filter"
            onClick={markAllAsRead}
            disabled={actionLoading !== null}
          >
            <CheckCheck size={16} />
            {actionLoading === "all"
              ? "Updating..."
              : "Mark All Read"}
          </button>
        )}
      </div>

      {/* NOTIFICATION LIST */}
      <div className="notifications-list-section">
        <div className="notifications-list-heading">
          <h2>
            {filter === "all"
              ? "Recent Notifications"
              : "Unread Notifications"}
          </h2>
        </div>

        {loading ? (
          <div className="notifications-loading">
            <Loader2
              size={30}
              className="notifications-spinning"
            />
            <p>Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="notifications-error">
            <AlertTriangle size={30} />
            <p>{error}</p>

            <button
              type="button"
              onClick={() => fetchNotifications()}
            >
              Try Again
            </button>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="notifications-empty">
            {filter === "unread" ? (
              <CheckCircle2 size={42} />
            ) : (
              <Inbox size={42} />
            )}

            <h3>
              {filter === "unread"
                ? "You're all caught up!"
                : "No notifications yet"}
            </h3>

            <p>
              {filter === "unread"
                ? "There are no unread notifications."
                : "Business updates and alerts will appear here."}
            </p>
          </div>
        ) : (
          <div className="notifications-list">
            {filteredNotifications.map((item) => {
              const Icon = getNotificationIcon(item.type);
              const isUnread = item.isRead === false;

              return (
                <div
                  className={`notifications-card ${
                    isUnread
                      ? "notifications-card-unread"
                      : ""
                  }`}
                  key={item._id}
                >
                  <div
                    className={`notifications-card-icon ${getNotificationClass(
                      item.type
                    )}`}
                  >
                    <Icon size={21} />
                  </div>

                  <div className="notifications-card-content">
                    <div className="notifications-card-title-row">
                      <h3>
                        {item.title || "Notification"}
                      </h3>

                      {isUnread && (
                        <span className="notifications-unread-dot" />
                      )}
                    </div>

                    <p>
                      {item.message ||
                        "No additional details available."}
                    </p>

                    <div className="notifications-card-footer">
                      <span>
                        {formatDate(item.createdAt)}
                      </span>

                      <span
                        className={
                          isUnread
                            ? "notifications-status-unread"
                            : "notifications-status-read"
                        }
                      >
                        {isUnread ? "Unread" : "Read"}
                      </span>
                    </div>

                    {isUnread && (
                      <button
                        type="button"
                        className="notifications-mark-read-button"
                        onClick={() => markAsRead(item._id)}
                        disabled={actionLoading !== null}
                      >
                        <CheckCircle2 size={15} />
                        {actionLoading === item._id
                          ? "Updating..."
                          : "Mark as read"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <OwnerBottomNav />
    </div>
  );
}

export default Notifications;
