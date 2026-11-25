
import dotenv from "dotenv";
dotenv.config();



import mongoose from "mongoose";
import processWhatsAppReminders from "./services/whatsappReminder.service.js";
import connectDB from "./config/db.js";


const TEST_INVOICE_ID = "6b0718efe70db848feae1d09";

const runTest = async () => {
  try {
    if (process.env.WHATSAPP_TEST_MODE !== "true") {
      throw new Error("WhatsApp test mode is not enabled!");
    }

    if (
      TEST_INVOICE_ID === "PASTE_YOUR_TEST_INVOICE_ID_HERE"
    ) {
      throw new Error("Please enter your test invoice ID.");
    }

    console.log("🧪 Starting WhatsApp reminder test...");

    await connectDB();

    await processWhatsAppReminders({
      testInvoiceId: TEST_INVOICE_ID,
    });

    console.log("✅ Test completed. Check the backend logs and WhatsApp.");

  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

runTest();
