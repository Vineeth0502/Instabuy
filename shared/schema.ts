import { z } from "zod";

export const orderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number(),
  price: z.string(),
  name: z.string()
});

export const orderSchema = z.object({
  userId: z.string(),
  items: z.array(orderItemSchema),
  total: z.number(),
  status: z.enum(["pending", "completed", "cancelled"]),
  createdAt: z.string().optional(),
});

export type OrderItem = z.infer<typeof orderItemSchema>;
export type Order = z.infer<typeof orderSchema>;

import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("user"),
  fullName: text("full_name"),
  profileImage: text("profile_image"),
  phoneNumber: text("phone_number"),
  address: text("address"),
  bio: text("bio"),
  storeId: integer("store_id").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
});

export const updateProfileSchema = createInsertSchema(users).pick({
  fullName: true,
  profileImage: true,
  phoneNumber: true,
  address: true,
  bio: true,
});

// Store model
export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  logo: text("logo"),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertStoreSchema = createInsertSchema(stores).pick({
  name: true,
  description: true,
  logo: true,
  userId: true,
});

// Product model
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: text("price").notNull(),
  category: text("category"),
  sku: text("sku"),
  stock: integer("stock").notNull().default(0),
  image: text("image"),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertProductSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  price: z.string(),
  category: z.string().optional(),
  sku: z.string().optional(),
  stock: z.number(),
  image: z.string().optional(),
  storeId: z.string()
});

export const insertProductsFromCsvSchema = z.array(
  z.object({
    name: z.string(),
    description: z.string().optional(),
    price: z.number(),
    category: z.string().optional(),
    sku: z.string().optional(),
    stock: z.number().or(z.string().transform(Number)).default(0),
    image: z.string().optional(),
  }),
);

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type Store = typeof stores.$inferSelect;
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type ProductFromCsv = z.infer<typeof insertProductsFromCsvSchema>[number];