import express from "express";
import { ownerOnly, protect } from "../middleware/auth.middleware.js";
import { addProduct, deactivateProduct, getProductById, getProducts, updateProduct } from "../controllers/product.controller.js";



const product = express.Router();

// Owner + Worker can view products
product.get("/", protect, getProducts);
product.get("/:id", protect, getProductById);

// Owner only
product.post("/", protect, ownerOnly, addProduct);
product.put("/:id", protect, ownerOnly, updateProduct);
product.patch("/:id/deactivate", protect, ownerOnly, deactivateProduct);

export default product;