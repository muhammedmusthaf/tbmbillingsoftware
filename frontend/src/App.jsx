import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import ProtectedRoute from "./components/productroute";
import Billing from "./pages/Billing";
import Payment from "./pages/Payment";




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
