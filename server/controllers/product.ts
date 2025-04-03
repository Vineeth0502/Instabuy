import { Router, Response } from "express";
import { IStorage } from "../storage";
import { insertProductSchema, insertProductsFromCsvSchema } from "@shared/schema";
import { AuthRequest, authenticateToken, requireAdmin, requireSeller } from "../middleware/auth";
import { csvUpload, imageUpload } from "../middleware/upload";
import fs from "fs";
import { parse } from "csv-parse";
import mongoose from "mongoose";
import path from "path";


export function registerProductRoutes(router: Router, storage: IStorage) {
  // Upload products from CSV (for sellers and admins)
  // Create a new product
  router.post(
    "/products",
    authenticateToken,
    requireSeller,
    async (req: AuthRequest, res: Response) => {
      try {
        console.log("POST /products - Starting product creation");
        console.log("Request user:", {
          id: req.user?.id,
          _id: req.user?._id,
          username: req.user?.username
        });

        if (!req.user) {
          console.log("No authenticated user found");
          return res.status(401).json({ message: "Authentication required" });
        }

        // Get user's store
        console.log("Looking up store for user ID:", req.user._id.toString());
        const store = await storage.getStoreByUserId(req.user._id.toString());

        if (!store) {
          console.log("No store found for user");
          return res.status(404).json({ message: "Store not found" });
        }

        console.log("Found store:", {
          id: store.id,
          store_id: store.store_id,
          name: store.name
        });

        // Validate product data
        const storeId = store._id.toString(); // Convert ObjectId to string immediately
        console.log("Store ID before validation:", { storeId, type: typeof storeId });

        if (!storeId) {
          return res.status(400).json({ message: "Valid store ID is required" });
        }

        console.log("\n=== Product Creation Data Validation ===");
        console.log("Store found:", {
          _id: store._id,
          id: store.id,
          store_id: store.store_id,
          name: store.name
        });

        const productData = {
          name: req.body.name,
          description: req.body.description || "",
          price: req.body.price,
          category: req.body.category || "",
          sku: req.body.sku || "",
          stock: parseInt(req.body.stock) || 0,
          image: req.body.image || "",
          storeId: store._id.toString()
        };

        if (!productData.storeId) {
          return res.status(400).json({ message: "Store ID is required" });
        }

        const validationResult = insertProductSchema.safeParse(productData);
        if (!validationResult.success) {
          console.log("Product validation failed:", validationResult.error);
        }
        if (!validationResult.success) {
          return res.status(400).json({
            message: "Invalid product data",
            errors: validationResult.error.errors
          });
        }

        // Create the product with properly formatted storeId
        const product = await storage.createProduct(productData);
        res.status(201).json(product);
      } catch (error) {
        console.error("Create product error:", error);
        res.status(500).json({ message: "Server error creating product" });
      }
    }
  );

  router.post(
    "/products/upload", 
    authenticateToken, 
    csvUpload.single("file"), 
    async (req: AuthRequest, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Authentication required" });
        }

        if (!req.file) {
          return res.status(400).json({ message: "CSV file is required" });
        }

        // Get user's store
        const store = await storage.getStoreByUserId(req.user._id.toString());
        if (!store) {
          return res.status(404).json({ message: "Store not found" });
        }

        const storeId = store._id.toString();

        // Parse CSV file
        const fileContent = fs.readFileSync(req.file.path, { encoding: 'utf-8' });

        // Use csv-parse to parse the CSV data
        const records: any[] = [];
        const parser = parse(fileContent, {
          columns: true,
          skip_empty_lines: true
        });

        for await (const record of parser) {
          records.push(record);
        }

        // Delete the uploaded file after parsing
        fs.unlinkSync(req.file.path);

        if (records.length === 0) {
          return res.status(400).json({ message: "CSV file is empty or invalid" });
        }

        // Validate the records from CSV
        const productsData = records.map(record => ({
          name: record.name?.trim() || "",
          description: record.description?.trim() || "",
          price: record.price?.toString().trim() || "0",
          category: record.category?.trim() || "",
          sku: record.sku?.trim() || "",
          stock: parseInt(record.stock) || 0,
          image: record.image?.trim() || "",
        }));

        const validationResult = insertProductsFromCsvSchema.safeParse(productsData);
        if (!validationResult.success) {
          return res.status(400).json({ 
            message: "Invalid product data in CSV", 
            errors: validationResult.error.errors 
          });
        }

        // Create products from validated data
        const createdProducts = await storage.createProductsFromCsv(validationResult.data, storeId);

        res.status(201).json({
          success: true,
          count: createdProducts.length,
          message: `Successfully added ${createdProducts.length} products`
        });
      } catch (error) {
        console.error("CSV upload error:", error);

        // Clean up file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

        res.status(500).json({ message: "Server error processing CSV file" });
      }
    }
  );

  // Get products for a store (public)
  router.get("/products/store/:id", async (req, res) => {
    try {
      const storeId = req.params.id;
      const store = await storage.getStoreByStoreId(storeId);
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }

      const products = await storage.getProductsByStoreId(store._id.toString());
      res.json(products);
    } catch (error) {
      console.error("Get store products error:", error);
      res.status(500).json({ message: "Server error fetching products" });
    }
  });

  // Get seller's store products
  router.get(
    "/products/mine", 
    authenticateToken, 
    async (req: AuthRequest, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Authentication required" });
        }

        // Get user's store
        const store = await storage.getStoreByUserId(req.user.id);
        if (!store) {
          return res.status(404).json({ message: "Store not found" });
        }

        const products = await storage.getProductsByStoreId(store.id);
        res.json(products);
      } catch (error) {
        console.error("Get admin products error:", error);
        res.status(500).json({ message: "Server error fetching products" });
      }
    }
  );

  // Get all products (public)
  router.get("/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error("Get all products error:", error);
      res.status(500).json({ message: "Server error fetching products" });
    }
  });

  // Get featured products (for dashboard)
  router.get("/products/featured", async (req, res) => {
    try {
      // Get all products
      const allProducts = await storage.getAllProducts();

      // Simulate featured products (normally this would have a featured flag or algorithm)
      // For now, just return some random products, up to 8
      const featuredProducts = allProducts
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.min(8, allProducts.length));

      res.json(featuredProducts);
    } catch (error) {
      console.error("Get featured products error:", error);
      res.status(500).json({ message: "Server error fetching featured products" });
    }
  });

  // Delete a product
  router.delete(
    "/products/:id", 
    authenticateToken, 
    async (req: AuthRequest, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Authentication required" });
        }

        const productId = req.params.id;

        try {
          // Attempt to fetch the product
          const product = await storage.getProduct(productId);
          if (!product) {
            return res.status(404).json({ message: "Product not found" });
          }

          // Get user's store
          const store = await storage.getStoreByUserId(req.user._id.toString());
          if (!store) {
            return res.status(404).json({ message: "Store not found" });
          }

          // Check if product belongs to user's store
          if (product.storeId.toString() !== store._id.toString()) {
            return res.status(403).json({ message: "You don't have permission to delete this product" });
          }

          // Delete the product
          const deleted = await storage.deleteProduct(productId);
          if (!deleted) {
            return res.status(500).json({ message: "Failed to delete product" });
          }

          // Clean up product image if it exists
          if (product.image && product.image.startsWith('/uploads/')) {
            const imagePath = path.join(__dirname, '..', '..', product.image);
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
            }
          }

          res.json({ message: "Product deleted successfully" });
        } catch (err) {
          if (err.name === 'CastError' || err.kind === 'ObjectId') {
            return res.status(400).json({ message: "Invalid product ID format" });
          }
          throw err;
        }
      } catch (error) {
        console.error("Delete product error:", error);
        res.status(500).json({ message: "Server error deleting product" });
      }
    }
  );

  // Update product
  router.put("/products/:id", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      console.log('=== Update Product Request ===');
      console.log('Product ID:', req.params.id);
      console.log('Update data:', req.body);
      console.log('User:', req.user);

      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const productId = req.params.id;

      // Validate MongoDB ObjectId format
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        console.log('Invalid product ID format:', productId);
        return res.status(400).json({ message: "Invalid product ID format" });
      }

      // Get the product
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Get user's store
      const store = await storage.getStoreByUserId(req.user._id.toString());
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }

      // Check if product belongs to user's store
      if (product.storeId.toString() !== store._id.toString()) {
        return res.status(403).json({ message: "You don't have permission to update this product" });
      }

      // Update the product
      const updatedProduct = await storage.updateProduct(productId, req.body);
      if (!updatedProduct) {
        return res.status(500).json({ message: "Failed to update product" });
      }

      res.json(updatedProduct);
    } catch (error) {
      console.error("Update product error:", error);
      if (error instanceof mongoose.Error.CastError) {
        return res.status(400).json({ message: "Invalid product ID format" });
      }
      res.status(500).json({ message: "Server error updating product" });
    }
  });
}