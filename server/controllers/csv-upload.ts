import express, { Router, Request, Response } from 'express';
import { IStorage } from '../storage';
import multer from 'multer';
import { parse } from 'csv-parse';
import { Readable } from 'stream';
import { insertProductsFromCsvSchema, ProductFromCsv } from '@shared/schema';
import { authenticateToken } from '../middleware/auth';

// Set up multer for CSV file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_, file, cb) => {
    // Accept only CSV files
    if (file.mimetype !== 'text/csv' && file.mimetype !== 'application/csv') {
      return cb(new Error('Only CSV files are allowed'));
    }
    cb(null, true);
  },
});

export function registerCsvUploadRoutes(router: Router, storage: IStorage) {
  // Route for uploading CSV products
  router.post(
    '/products/csv-upload/:storeId',
    authenticateToken,
    upload.single('csvFile'),
    async (req: Request, res: Response) => {
      try {
        // Get file from multer
        if (!req.file) {
          return res.status(400).json({ message: 'No file uploaded' });
        }

        const storeId = parseInt(req.params.storeId);
        if (isNaN(storeId)) {
          return res.status(400).json({ message: 'Invalid store ID' });
        }

        // Get the store to verify it exists and belongs to the user
        const store = await storage.getStore(storeId);
        if (!store) {
          return res.status(404).json({ message: 'Store not found' });
        }

        // Verify ownership - authenticateToken middleware has added user to req
        const user = (req as any).user;
        if (!user || store.userId !== user.id) {
          return res.status(403).json({
            message: 'You do not have permission to upload products to this store',
          });
        }

        // Parse CSV file
        const buffer = req.file.buffer;
        const products = await parseCSV(buffer);

        // Validate the parsed products
        const validationResult = insertProductsFromCsvSchema.safeParse(products);
        if (!validationResult.success) {
          return res.status(400).json({
            message: 'Invalid CSV format',
            errors: validationResult.error.errors,
          });
        }

        // Add storeId to each product
        const productsWithStoreId = products.map((product) => ({
          ...product,
          storeId,
        }));

        // Store products in database
        const savedProducts = await storage.createProductsFromCsv(
          productsWithStoreId,
          storeId
        );

        return res.status(201).json({
          message: `Successfully uploaded ${savedProducts.length} products`,
          count: savedProducts.length,
          success: true,
        });
      } catch (error) {
        console.error('CSV upload error:', error);
        return res.status(500).json({
          message: error instanceof Error ? error.message : 'Failed to process CSV file',
          success: false,
        });
      }
    }
  );
}

// Helper function to parse CSV buffer into array of products
async function parseCSV(buffer: Buffer): Promise<ProductFromCsv[]> {
  return new Promise((resolve, reject) => {
    const products: ProductFromCsv[] = [];
    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    // Handle CSV parsing events
    parser.on('readable', function() {
      let record;
      while ((record = parser.read())) {
        // Convert stock from string to number if needed
        if (typeof record.stock === 'string') {
          record.stock = parseInt(record.stock, 10);
        }
        products.push(record);
      }
    });

    parser.on('error', function(err) {
      reject(err);
    });

    parser.on('end', function() {
      resolve(products);
    });

    // Create a Readable stream from buffer and pipe it to the parser
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);  // Signal the end of the stream
    stream.pipe(parser);
  });
}