
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, PlusCircle, ReceiptText } from "lucide-react";
import "../styles/workernav.css";

function WorkerBottomnav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      label: "Home",
      path: "/worker",
      icon: Home,
    },
    {
      label: "New Bill",
      path: "/worker/billing",
      icon: PlusCircle,
    },
    {
      label: "Bills",
      path: "/worker/bills",
      icon: ReceiptText,
    },
  ];

  return (
    <nav className="worker-bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon;

        const active =
          location.pathname === item.path ||
          (item.path !== "/worker" &&
            location.pathname.startsWith(item.path));

        return (
          <button
            type="button"
            key={item.path}
            className={
              active
                ? "worker-nav-item worker-nav-active"
                : "worker-nav-item"
            }
            onClick={() => navigate(item.path)}
          >
            <Icon size={21} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default WorkerBottomnav;
