import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import ProtectedRoute from "./components/productroute";
import Billing from "./pages/Billing";
import Payment from "./pages/Payment";
import Invoices from "./pages/Invoices";
import Inventory from "./pages/Inventory";
import StockIn from "./pages/Stockin";
import AddProduct from "./pages/Addproduct";
import Customers from "./pages/Customers";
import AddCustomer from "./pages/AddCusomer";
import CustomerCredit from "./pages/CustomerCredit";
import BillHistory from "./pages/BillHistory";
import Reports from "./pages/Reports";
import Workers from "./pages/Workers";




function App() {
  const token = localStorage.getItem("token");
  return (
    <BrowserRouter>

      <Routes>

        <Route path="/login" element={token ? (<Navigate to="/" replace />) : (<Login />)} />


        <Route element={<ProtectedRoute />} >

          <Route path="/" element={<Home />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/payment" element={<Payment />}/>
          <Route path="/bills/:id" element={<Invoices />} />
          <Route path="/inventory" element={<Inventory />}/>
          <Route path="/stock-in" element={<StockIn />}/>
          <Route path="/products/add" element={<AddProduct />}/>
          <Route path="/customers" element={<Customers />}/>
          <Route path="/customers/add" element={<AddCustomer />}/>
          <Route path="/customers/:id/credit" element={<CustomerCredit />}/>
          <Route path="/bills" element={<BillHistory />}/>
          <Route path="/reports" element={<Reports />}/>
          <Route path="/workers" element={<Workers />} />

        </Route>
         <Route
          path="*"
          element={
            <Navigate
              to={token ? "/" : "/login"}
              replace
            />
          }
        />



      </Routes>

    </BrowserRouter>
  );
}

export default App;
