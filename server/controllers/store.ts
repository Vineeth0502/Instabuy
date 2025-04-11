import { Router, Response } from "express";
import { IStorage } from "../storage";
import { insertStoreSchema } from "@shared/schema";
import { AuthRequest, authenticateToken, requireAdmin, requireSeller } from "../middleware/auth";
import { imageUpload } from "../middleware/upload";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";

export function registerStoreRoutes(router: Router, storage: IStorage) {
  // Create a new store (seller route with image)
  router.post(
    "/store/create",
    authenticateToken,
    requireSeller,
    imageUpload.single("logo"),
    async (req: AuthRequest, res: Response) => {
      try {
        const userId = req.user?._id;
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
          return res.status(400).json({ message: "Invalid or missing MongoDB user ID" });
        }

        const existingStore = await storage.getStoreByUserId(userId);
        if (existingStore) {
          return res.status(400).json({ message: "User already has a store" });
        }

        const storeData = {
          name: req.body.name,
          description: req.body.description || "",
          logo: req.file ? `/uploads/${req.file.filename}` : undefined,
          userId: userId, // Pass the ID directly, let storage layer handle conversion
        };

        const validationInput = {
          ...storeData,
          userId: 999, // dummy for zod schema validation
        };

        const validationResult = insertStoreSchema.safeParse(validationInput);
        if (!validationResult.success) {
          if (req.file) {
            fs.unlinkSync(req.file.path);
          }
          return res.status(400).json({
            message: "Invalid store data",
            errors: validationResult.error.errors,
          });
        }

        // Get highest store_id to generate next one
        const stores = await storage.getAllStores();
        const maxStoreId = stores.reduce((max, store) => {
          const storeIdNum = parseInt(store.store_id || '0');
          return storeIdNum > max ? storeIdNum : max;
        }, 1000); // Start from 1000 if no stores exist

        const store = await storage.createStore({
          ...validationResult.data,
          userId: userId,
          store_id: (maxStoreId + 1).toString(), // Increment from max
          logo: storeData.logo,
        });

        res.status(201).json({
          message: "Store created successfully",
          store: store,
        });
      } catch (error) {
        console.error("Create store error:", error);
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: "Server error creating store" });
      }
    }
  );

  // Get current user's store (admin only)
  router.get(
    "/store/my",
    authenticateToken,
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Authentication required" });
        }

        const userId = req.user.id;
        if (userId === undefined) {
          return res.status(400).json({ message: "User ID is missing" });
        }
        const store = await storage.getStoreByUserId(userId);
        if (!store) {
          return res.status(404).json({ message: "Store not found" });
        }

        res.json(store);
      } catch (error) {
        console.error("Get store error:", error);
        res.status(500).json({ message: "Server error fetching store" });
      }
    }
  );

  // Get all stores (public)
  router.get("/stores", async (_req, res) => {
    try {
      const stores = await storage.getAllStores();
      const storesWithDetails = await Promise.all(
        stores.map(async (store) => {
          let storeId = store._id?.toString();

          if (!mongoose.Types.ObjectId.isValid(storeId)) {
            console.warn('Invalid store ID format:', storeId);
            return {
              ...store,
              id: store._id?.toString(),
              productCount: 0,
              products: [],
              orders: []
            };
          }

          const [productCount, products] = await Promise.all([
            storage.getProductCountByStoreId(storeId),
            storage.getProductsByStoreId(storeId)
          ]);

          // Properly extract product IDs and fetch orders
          const productIds = products?.map(p => p._id?.toString()).filter(Boolean) || [];
          const orders = productIds.length > 0 ? await storage.getOrdersByProductIds(productIds) : [];

          return {
            ...store,
            id: store._id?.toString(),
            productCount,
            products: products?.slice(0, 4) || [],
            orders: orders.map(order => ({
              ...order,
              _id: order._id?.toString(),
              userId: order.userId?.toString()
            }))
          };
        })
      );
      res.json(storesWithDetails);
    } catch (error) {
      console.error("Get all stores error:", error);
      res.status(500).json({ message: "Server error fetching stores" });
    }
  });

  // Get store by ID (for public view)
  router.get("/stores/:id", async (req, res) => {
    try {
      const storeId = req.params.id;
      if (!storeId || !/^[0-9a-fA-F]{24}$/.test(storeId)) {
        return res.status(400).json({ message: "Invalid store ID format" });
      }

      const store = await storage.getStoreByStoreId(storeId);
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }
      res.json(store);
    } catch (error) {
      console.error("Get store error:", error);
      res.status(500).json({ message: "Server error fetching store" });
    }
  });

  // Get store info for multiple stores (used in product listing)
  router.get("/store/info", async (_req, res) => {
    try {
      const stores = await storage.getAllStores();
      const storeMap = stores.reduce((acc, store) => {
        acc[store.id] = store;
        return acc;
      }, {} as Record<number, typeof stores[0]>);
      res.json(storeMap);
    } catch (error) {
      console.error("Get store info error:", error);
      res.status(500).json({ message: "Server error fetching store info" });
    }
  });

  // Get seller's store (for seller dashboard)

  // Get store orders
  router.get(
    "/store/orders",
    authenticateToken,
    requireSeller,
    async (req: AuthRequest, res: Response) => {
      try {
        const userId = req.user?._id;
        if (!userId) {
          return res.status(401).json({ message: "Authentication required" });
        }

        const store = await storage.getStoreByUserId(userId);
        if (!store) {
          return res.status(404).json({ message: "Store not found" });
        }

        const orders = await storage.getOrdersByStoreId(store._id);
        res.json(orders);
      } catch (error) {
        console.error("Failed to fetch store orders:", error);
        res.status(500).json({ message: "Failed to fetch orders" });
      }
    }
  );

  router.get(
    "/store/seller",
    authenticateToken,
    requireSeller,
    async (req: AuthRequest, res: Response) => {
      try {
        console.log("\n=== GET /store/seller ===");
        console.log("Request user:", {
          id: req.user?.id,
          _id: req.user?._id,
          username: req.user?.username
        });

        if (!req.user) {
          console.log("No authenticated user found");
          return res.status(401).json({ message: "Authentication required" });
        }

        const userId = req.user._id;
        console.log("Looking up store for user ID:", userId);
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
          return res.status(400).json({ message: "Invalid user ID format" });
        }

        const store = await storage.getStoreByUserId(userId.toString());
        if (!store) {
          return res.status(404).json({ message: "Store not found", code: "NO_STORE" });
        }

        res.json(store);
      } catch (error) {
        console.error("Get seller store error:", error);
        res.status(500).json({ message: "Server error fetching seller's store" });
      }
    }
  );
}