import express, { Router, Request, Response } from "express";

console.log("✅ CSV Upload module loaded");
import { IStorage } from "../storage";
import multer from "multer";
import { parse } from "csv-parse";
import { Readable } from "stream";
import { insertProductsFromCsvSchema, ProductFromCsv } from "@shared/schema";
import { authenticateToken } from "../middleware/auth";

// Set up multer for CSV file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  preservePath: true,
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = [".csv"];
    const extname = allowedExtensions.includes(
      file.originalname.toLowerCase().slice(-4),
    );
    if (extname) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  },
});

export function registerCsvUploadRoutes(router: Router, storage: IStorage) {
  // Route for uploading CSV products
  router.post(
    "/products/csv-upload/:storeId",
    authenticateToken,
    upload.single("csvFile"),
    async (req: Request, res: Response) => {
      console.log("=== CSV Upload Request ===");
      console.log("Store ID:", req.params.storeId);
      console.log("User:", req.user);
      console.log("File:", req.file);
      console.log("Headers:", req.headers);

      try {
        // Get file from multer
        if (!req.file) {
          console.log("No file received in request");
          return res.status(400).json({ message: "No file uploaded" });
        }

        const storeId = req.params.storeId;
        if (!storeId || !/^[0-9a-fA-F]{24}$/.test(storeId)) {
          return res.status(400).json({ message: "Invalid store ID format" });
        }

        // Get the store to verify it exists and belongs to the user
        console.log("=== CSV Upload Request ===");
        console.log("Store ID:", storeId);
        console.log("User:", req.user);

        const store = await storage.getStoreByStoreId(storeId);
        if (!store) {
          console.log("Store not found for ID:", storeId);
          return res.status(404).json({ message: "Store not found" });
        }

        console.log("Found store:", store);

        // Verify ownership - authenticateToken middleware has added user to req
        const user = (req as any).user;
        if (!user || store.userId.toString() !== user._id.toString()) {
          console.log("Authorization failed:", {
            storeUserId: store.userId,
            requestUserId: user?._id,
          });
          return res.status(403).json({
            message:
              "You do not have permission to upload products to this store",
          });
        }

        // Parse CSV file
        console.log("=== Processing CSV Upload ===");
        console.log("File details:", {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
        });

        const buffer = req.file.buffer;
        const products = await parseCSV(buffer);
        console.log("Raw parsed CSV products:", products);

        // Add storeId and ensure numeric fields
        const productsWithStoreId = products.map((product, index) => {
          console.log(`Processing product ${index + 1}:`, product);
          const processed = {
            ...product,
            storeId,
            price: parseFloat(product.price),
            stock: parseInt(product.stock?.toString() || "0", 10) || 0,
          };
          console.log(`Processed product ${index + 1}:`, processed);
          return processed;
        });

        console.log("All products with store ID:", productsWithStoreId);

        // Validate the parsed products
        const validationResult =
          insertProductsFromCsvSchema.safeParse(productsWithStoreId);
        console.log("Validation result:", validationResult);
        if (!validationResult.success) {
          console.error("CSV Validation Failed:", {
            errors: validationResult.error.errors,
            invalidData: productsWithStoreId,
          });
          return res.status(400).json({
            message:
              "Invalid CSV format - please check the required fields and data types",
            errors: validationResult.error.errors.map((err) => ({
              path: err.path.join("."),
              message: err.message,
            })),
          });
        }

        console.log("CSV Validation Passed:", {
          productCount: productsWithStoreId.length,
          validatedData: validationResult.data,
        });

        // Store products in database
        const savedProducts = await storage.createProductsFromCsv(
          productsWithStoreId,
          storeId,
        );

        console.log("Saved products:", savedProducts);

        return res.status(201).json({
          message: `Successfully uploaded ${savedProducts.length} products`,
          count: savedProducts.length,
          success: true,
        });
      } catch (error) {
        console.error("CSV upload error:", error);
        return res.status(500).json({
          message:
            error instanceof Error
              ? error.message
              : "Failed to process CSV file",
          success: false,
        });
      }
    },
  );
}

// Helper function to parse CSV buffer into array of products
async function parseCSV(buffer: Buffer): Promise<ProductFromCsv[]> {
  return new Promise((resolve, reject) => {
    const products: ProductFromCsv[] = [];
    console.log("Starting CSV parse");

    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      on_record: (record, context) => {
        console.log(`Parsing row ${context.records}:`, record);
        return record;
      },
    });

    // Handle CSV parsing events
    parser.on("readable", function () {
      let record;
      while ((record = parser.read())) {
        if (typeof record.stock === "string") {
          record.stock = parseInt(record.stock, 10);
        }
        products.push(record);
      }
    });

    parser.on("error", function (err) {
      reject(err);
    });

    parser.on("end", function () {
      resolve(products);
    });

    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    stream.pipe(parser);
  });
}
