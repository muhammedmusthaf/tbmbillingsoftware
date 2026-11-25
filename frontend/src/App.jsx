import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

import Billing from "./pages/Billing";
import Payment from "./pages/Payment";
import Invoices from "./pages/Invoices";
import Inventory from "./pages/Inventory";

import Customers from "./pages/Customers";
import AddCustomer from "./pages/AddCustomer";
import CustomerCredit from "./pages/CustomerCredit";
import BillHistory from "./pages/BillHistory";
import Reports from "./pages/Reports";
import Workers from "./pages/Workers";
import More from "./pages/More";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import Returns from "./pages/Returns";


import WorkerDashboard from "./pages/WorkerDashboard";
import WorkerBilling from "./pages/WorkerBilling";
import WorkerPayment from "./pages/WorkerPayment";
import WorkerInvoices from "./pages/WorkerInvoices";
import WorkerBillhistory from "./pages/WorkerBillhistory";
import AddProduct from "./pages/AddProduct";
import StockIn from "./pages/StockIn";

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

function getDashboardPath() {
  const user = getUser();

  if (user?.role === "owner") return "/";
  if (user?.role === "worker") return "/worker";

  return "/login";
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC LOGIN */}
        <Route
          path="/login"
          element={
            localStorage.getItem("token") && getUser()
              ? <Navigate to={getDashboardPath()} replace />
              : <Login />
          }
        />

        {/* OWNER ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={["owner"]} />}>
          <Route path="/" element={<Home />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/bills/:id" element={<Invoices />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/stock-in" element={<StockIn />} />
          <Route path="/products/add" element={<AddProduct />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/add" element={<AddCustomer />} />
          <Route path="/customers/:id/credit" element={<CustomerCredit />} />
          <Route path="/bills" element={<BillHistory />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/workers" element={<Workers />} />
          <Route path="/more" element={<More />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/returns" element={<Returns />} />
        </Route>

        {/* WORKER ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={["worker"]} />}>
          <Route path="/worker" element={<WorkerDashboard />} />
          <Route path="/worker/billing" element={<WorkerBilling />} />
          <Route path="/worker/payment" element={<WorkerPayment />} />
          <Route path="/worker/invoice/:id" element={<WorkerInvoices />} />
          <Route path="/worker/bills" element={<WorkerBillhistory />} />
        </Route>

        {/* UNKNOWN ROUTES */}
        <Route
          path="*"
          element={
            <Navigate
              to={
                localStorage.getItem("token")
                  ? getDashboardPath()
                  : "/login"
              }
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;