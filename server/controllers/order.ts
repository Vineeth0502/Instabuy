import { Router, Response } from "express";
import { IStorage } from "../storage";
import { AuthRequest, authenticateToken } from "../middleware/auth";
import { orderSchema } from "@shared/schema";

export function registerOrderRoutes(router: Router, storage: IStorage) {
  // Create order
  router.post("/orders", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      console.log("\n=== Creating Order ===");
      console.log("User:", req.user);
      console.log("Request body:", req.body);
      
      // Validate request has items
      if (!req.body.items || !Array.isArray(req.body.items) || req.body.items.length === 0) {
        console.error("Order validation failed: No items in order");
        return res.status(400).json({ message: "Order must contain items" });
      }
      
      const userId = req.user?._id.toString(); // Convert ObjectId to string
      if (!userId) {
        console.log("No user ID found");
        return res.status(401).json({ message: "No user ID found" });
      }
      
      const orderData = orderSchema.parse({ 
        ...req.body,
        items: req.body.items.map(item => ({
          ...item,
          name: item.name // Preserve the name field
        })),
        userId,
        status: 'pending' // Set default status
      });
      console.log("Validated order data:", orderData);
      
      // Check stock availability for all items
      console.log("\n=== Checking Stock ===");
      for (const item of orderData.items) {
        console.log(`Checking product ${item.productId}`);
        const product = await storage.getProduct(item.productId);
        if (!product) {
          console.log(`Product ${item.productId} not found`);
          return res.status(404).json({ message: `Product ${item.productId} not found` });
        }
        console.log(`Product ${product.name}: Stock ${product.stock}, Requested ${item.quantity}`);
        if (product.stock < item.quantity) {
          console.log(`Insufficient stock for ${product.name}`);
          return res.status(400).json({ 
            message: `Insufficient stock for product ${product.name}. Available: ${product.stock}`
          });
        }
      }

      console.log("\n=== Updating Stock ===");
      // Update product stock and create order
      for (const item of orderData.items) {
        console.log(`Reducing stock for product ${item.productId} by ${item.quantity}`);
        await storage.updateProductStock(item.productId, -item.quantity);
      }

      console.log("\n=== Creating Order ===");
      const order = await storage.createOrder(orderData);
      console.log("Order created:", order);
      res.status(201).json(order);
    } catch (error) {
      console.error("Order creation error:", error);
      res.status(400).json({ 
        message: "Failed to create order",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get all orders (admin/seller)
  router.get("/orders/all", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      let orders;
      if (req.user?.role === 'seller') {
        // Get store of seller
        const store = await storage.getStoreByUserId(userId);
        if (!store) {
          return res.status(404).json({ message: "Store not found" });
        }
        orders = await storage.getOrdersByStoreId(store._id);
      } else {
        orders = await storage.getAllOrders();
      }

      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Get user orders with enhanced details
  router.get("/orders", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?._id.toString();
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      const orders = await storage.getOrdersByUserId(userId);
      
      // Enhance orders with product and store details
      const enhancedOrders = await Promise.all(orders.map(async (order) => {
        const itemsWithDetails = await Promise.all(order.items.map(async (item) => {
          const product = await storage.getProduct(item.productId);
          const store = product ? await storage.getStore(product.storeId) : null;
          return {
            ...item,
            productDetails: product ? {
              name: product.name,
              description: product.description,
              image: product.image,
              category: product.category
            } : null,
            storeDetails: store ? {
              name: store.name,
              logo: store.logo
            } : null
          };
        }));
        
        return {
          ...order,
          items: itemsWithDetails
        };
      }));
      
      res.json(enhancedOrders);
    } catch (error) {
      console.error("Error fetching user orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Get seller orders (orders containing their products)
  router.get("/seller/orders", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      // Check if user is a seller
      if (req.user?.role !== 'seller') {
        return res.status(403).json({ message: "Only sellers can access this endpoint" });
      }

      const sellerId = req.user?._id;
      const store = await storage.getStoreByUserId(sellerId);
      
      if (!store) {
        return res.status(404).json({ message: "Store not found for this seller" });
      }

      // Get all products from the seller's store
      const products = await storage.getProductsByStoreId(store._id);
      const productIds = products.map(p => p._id);

      // Get all orders that contain the seller's products
      const orders = await storage.getOrdersByProductIds(productIds);
      
      // Enhance orders with user and product details
      const enhancedOrders = await Promise.all(orders.map(async (order) => {
        const user = await storage.getUser(order.userId);
        const itemsWithDetails = await Promise.all(order.items.map(async (item) => {
          const product = await storage.getProduct(item.productId);
          return {
            ...item,
            productDetails: product ? {
              name: product.name,
              description: product.description,
              image: product.image,
              category: product.category
            } : null
          };
        }));
        
        return {
          ...order,
          userDetails: user ? {
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            address: user.address
          } : null,
          items: itemsWithDetails
        };
      }));
      
      res.json(enhancedOrders);
    } catch (error) {
      console.error("Error fetching seller orders:", error);
      res.status(500).json({ message: "Failed to fetch seller orders" });
    }
  });
}
