
const sendWhatsAppTemplate = async ({
  to,
  templateName,
  languageCode,
  components,
}) => {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION;

  if (!accessToken || !phoneNumberId || !apiVersion) {
    throw new Error(
      "Missing WhatsApp API configuration in environment variables"
    );
  }

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: languageCode,
      },
      components,
    },
  };
  console.log("WhatsApp diagnostic:", {
  tokenLoaded: Boolean(accessToken),
  tokenLength: accessToken?.length,
  phoneNumberId,
  apiVersion,
  recipient: to,
});

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("WhatsApp API Error:", data);

    throw new Error(
      data.error?.message || "WhatsApp API request failed"
    );
  }

  return data;
};
export const sendCreditPaymentReminder = async ({
  to,
  customerName,
  amount,
  invoiceNumber,
  reminderType,
}) => {
  const testMode = process.env.WHATSAPP_TEST_MODE === "true";

  // Test mode always sends to your verified test recipient
  const recipient = testMode
    ? process.env.WHATSAPP_TEST_RECIPIENT
    : to;

  if (!recipient) {
    throw new Error("WhatsApp recipient number is missing");
  }

  if (!testMode && !to) {
    throw new Error("Customer WhatsApp number is missing");
  }

  return sendWhatsAppTemplate({
    to: recipient,
    templateName: "credit_payment_reminder",
    languageCode: "en",
    components: [
      {
        type: "body",
        parameters: [
          {
            type: "text",
            text: `${customerName} (${reminderType.replace("_", " ")})`,
          },
          {
            type: "text",
            text: Number(amount).toFixed(2),
          },
          {
            type: "text",
            text: invoiceNumber,
          },
        ],
      },
    ],
  });
};


