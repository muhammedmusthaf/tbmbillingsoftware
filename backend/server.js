import "dotenv/config";
import cron from "node-cron";
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
import checkCreditDueNotifications from './utils/checkCreditDueNotifications.js';
import processWhatsAppReminders from './services/whatsappReminder.service.js';
import device from "./routes/device.route.js";


const app = express();

app.use(cors({
    origin: [
        "https://tbmbillingsoftware.vercel.app",
        "https://localhost"
    ],
 methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS"
    ],
    credentials: true
}));
app.use(express.json());

await connectDB();
// Automatically check overdue customer credits every day at 8 AM

// Daily credit due notifications — 8 AM IST
cron.schedule(
  "0 8 * * *",
  async () => {
    console.log("Running daily credit due notification check...");

    try {
      await checkCreditDueNotifications();
      console.log("Credit due notification check completed.");
    } catch (error) {
      console.error("Credit notification scheduler failed:", error);
    }
  },
  {
    timezone: "Asia/Kolkata",
  }
);

// WhatsApp payment reminders — 8 PM IST
cron.schedule(
  "0 20 * * *",
  async () => {
    console.log("Running WhatsApp payment reminder service...");

    try {
      await processWhatsAppReminders();
      console.log("WhatsApp reminder scheduler completed.");
    } catch (error) {
      console.error("WhatsApp reminder scheduler failed:", error);
    }
  },
  {
    timezone: "Asia/Kolkata",
  }
);

 // Retry failed WhatsApp reminders every 15 minutes.
 // retryOnly prevents this job from creating/sending new scheduled reminders.
cron.schedule(
  "*/15 * * * *",
  async () => {
    console.log("Checking WhatsApp reminders due for retry...");

    try {
      await processWhatsAppReminders({ retryOnly: true });
      console.log("WhatsApp retry check completed.");
    } catch (error) {
      console.error("WhatsApp retry scheduler failed:", error);
    }
  },
  {
    timezone: "Asia/Kolkata",
  }
);
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
app.use("/api/device", device);
app.get('/', (req, res) => res.send('Backend running...'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
