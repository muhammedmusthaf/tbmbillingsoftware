import Setting from "../models/Setting.model.js";

// ==========================================
// GET SHOP SETTINGS
// ==========================================
export const getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();

    // If settings do not exist yet,
    // create default settings automatically
    if (!settings) {
      settings = await Setting.create({
        shopName: "Buildmart Hardware",
      });
    }

    res.status(200).json({
      settings,
    });
  } catch (error) {
    console.error(
      "GET SETTINGS ERROR:",
      error
    );

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// ==========================================
// UPDATE SHOP SETTINGS
// ==========================================
export const updateSettings = async (req, res) => {
  try {
    const {
      shopName,
      ownerName,
      phone,
      alternatePhone,
      email,
      address,
      gstin,

      logo,

      upiId,
      upiName,
      upiQrImage,

      invoicePrefix,
      invoiceFooter,
      showGST,
      showLogo,

      printSize,
      autoPrint,

      lowStockNotification,

      currency,
      currencySymbol,
    } = req.body;

    let settings = await Setting.findOne();

    // Create settings if they don't exist
    if (!settings) {
      settings = new Setting({
        shopName:
          shopName || "Buildmart Hardware",
      });
    }

    // -----------------------------------
    // SHOP DETAILS
    // -----------------------------------

    if (shopName !== undefined)
      settings.shopName = shopName;

    if (ownerName !== undefined)
      settings.ownerName = ownerName;

    if (phone !== undefined)
      settings.phone = phone;

    if (alternatePhone !== undefined)
      settings.alternatePhone =
        alternatePhone;

    if (email !== undefined)
      settings.email = email;

    if (address !== undefined)
      settings.address = address;

    if (gstin !== undefined)
      settings.gstin = gstin;

    // -----------------------------------
    // LOGO
    // -----------------------------------

    if (logo !== undefined)
      settings.logo = logo;

    // -----------------------------------
    // UPI
    // -----------------------------------

    if (upiId !== undefined)
      settings.upiId = upiId;

    if (upiName !== undefined)
      settings.upiName = upiName;

    if (upiQrImage !== undefined)
      settings.upiQrImage = upiQrImage;

    // -----------------------------------
    // INVOICE SETTINGS
    // -----------------------------------

    if (invoicePrefix !== undefined)
      settings.invoicePrefix =
        invoicePrefix;

    if (invoiceFooter !== undefined)
      settings.invoiceFooter =
        invoiceFooter;

    if (showGST !== undefined)
      settings.showGST = showGST;

    if (showLogo !== undefined)
      settings.showLogo = showLogo;

    // -----------------------------------
    // PRINT SETTINGS
    // -----------------------------------

    if (printSize !== undefined)
      settings.printSize = printSize;

    if (autoPrint !== undefined)
      settings.autoPrint = autoPrint;

    // -----------------------------------
    // INVENTORY SETTINGS
    // -----------------------------------

    if (
      lowStockNotification !== undefined
    )
      settings.lowStockNotification =
        lowStockNotification;

    // -----------------------------------
    // GENERAL
    // -----------------------------------

    if (currency !== undefined)
      settings.currency = currency;

    if (currencySymbol !== undefined)
      settings.currencySymbol =
        currencySymbol;

    await settings.save();

    res.status(200).json({
      message:
        "Settings updated successfully",

      settings,
    });
  } catch (error) {
    console.error(
      "UPDATE SETTINGS ERROR:",
      error
    );

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};