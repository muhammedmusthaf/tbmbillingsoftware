import Product from "../models/Product.model.js";


// ADD PRODUCT
export const addProduct = async (req, res) => {
  try {
    const {
      name,
      productCode,
      barcode,
      category,
      brand,
      description,
      purchasePrice,
      sellingPrice,
      gst,
      unit,
      stock,
      minimumStock,
      supplier,
      image,
    } = req.body;

    if (
      !name ||
      !productCode ||
      !category ||
      purchasePrice === undefined ||
      sellingPrice === undefined ||
      !unit
    ) {
      return res.status(400).json({
        message: "Please provide all required fields",
      });
    }

    const existingProduct = await Product.findOne({
      productCode: productCode.toUpperCase(),
    });

    if (existingProduct) {
      return res.status(400).json({
        message: "Product code already exists",
      });
    }

    // Check barcode only if provided
    if (barcode) {
      const existingBarcode = await Product.findOne({ barcode });

      if (existingBarcode) {
        return res.status(400).json({
          message: "Barcode already exists",
        });
      }
    }

    const product = await Product.create({
      name,
      productCode,
      barcode: barcode || undefined,
      category,
      brand,
      description,
      purchasePrice,
      sellingPrice,
      gst,
      unit,
      stock,
      minimumStock,
      supplier,
      image,
    });

    res.status(201).json({
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// GET ALL PRODUCTS
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      count: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// GET SINGLE PRODUCT
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.status(200).json({
      product,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// UPDATE PRODUCT
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const {
      name,
      productCode,
      barcode,
      category,
      brand,
      description,
      purchasePrice,
      sellingPrice,
      gst,
      unit,
      stock,
      minimumStock,
      supplier,
      image,
    } = req.body;

    if (productCode && productCode.toUpperCase() !== product.productCode) {
      const existingCode = await Product.findOne({
        productCode: productCode.toUpperCase(),
        _id: { $ne: product._id },
      });

      if (existingCode) {
        return res.status(400).json({
          message: "Product code already exists",
        });
      }
    }

    if (barcode && barcode !== product.barcode) {
      const existingBarcode = await Product.findOne({
        barcode,
        _id: { $ne: product._id },
      });

      if (existingBarcode) {
        return res.status(400).json({
          message: "Barcode already exists",
        });
      }
    }

    if (name !== undefined) product.name = name;
    if (productCode !== undefined) product.productCode = productCode;
    if (barcode !== undefined) product.barcode = barcode || undefined;
    if (category !== undefined) product.category = category;
    if (brand !== undefined) product.brand = brand;
    if (description !== undefined) product.description = description;
    if (purchasePrice !== undefined) product.purchasePrice = purchasePrice;
    if (sellingPrice !== undefined) product.sellingPrice = sellingPrice;
    if (gst !== undefined) product.gst = gst;
    if (unit !== undefined) product.unit = unit;
    if (stock !== undefined) product.stock = stock;
    if (minimumStock !== undefined) product.minimumStock = minimumStock;
    if (supplier !== undefined) product.supplier = supplier;
    if (image !== undefined) product.image = image;

    const updatedProduct = await product.save();

    res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// DEACTIVATE PRODUCT
export const deactivateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    product.isActive = false;

    await product.save();

    res.status(200).json({
      message: "Product deactivated successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};