import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import auth from './routes/auth.route.js';
import product from './routes/product.route.js';
import inventory from './routes/inventory.route.js';
import customer from './routes/customer.route.js';
import invoice from './routes/invoice.route.js';
import credit from './routes/credit.route.js';
import dashboard from './routes/dashboard.route.js';
import returnrouter from './routes/return.route.js';
import report from './routes/report.route.js';
import worker from './routes/worker.route.js';
import setting from './routes/setting.route.js';
import notification from './routes/notification.route.js';

;


const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

await connectDB();
app.use("/api/auth", auth);
app.use("/api/products",product);
app.use("/api/customers",customer);
app.use("/api/inventory",inventory);

app.use("/api/invoices", invoice);
app.use("/api/credit", credit);
app.use("/api/dashboard",dashboard);

app.use("/api/returns",returnrouter);

app.use("/api/reports", report);
app.use("/api/workers", worker);
app.use("/api/settings", setting);
app.use("/api/notifications", notification);
app.get('/', (req, res) => res.send('Backend running...'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
