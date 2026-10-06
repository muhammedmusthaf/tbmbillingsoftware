import Counter from "../models/Counter.model.js";


const generateInvoiceNumber = async (
  prefix = "INV",
  session = null
) => {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  const datePart =
    `${year}${month}${day}`;


  // Separate sequence for each day
  const counterKey =
    `invoice-${datePart}`;


  const counter =
    await Counter.findOneAndUpdate(
      {
        key: counterKey,
      },

      {
        $inc: {
          sequence: 1,
        },
      },

      {
        new: true,
        upsert: true,

        // Connect counter update
        // to invoice transaction
        session,
      }
    );


  const sequence =
    String(
      counter.sequence
    ).padStart(
      4,
      "0"
    );


  // Clean invoice prefix
  const finalPrefix =
    String(prefix || "INV")
      .trim()
      .toUpperCase();


  return `${finalPrefix}-${datePart}-${sequence}`;
};


export default generateInvoiceNumber;