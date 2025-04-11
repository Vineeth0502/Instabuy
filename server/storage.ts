import { 
  InsertUser, User, UpdateProfile,
  InsertStore, Store, 
  InsertProduct, Product, 
  ProductFromCsv,
  Order
} from "@shared/schema";
import bcrypt from "bcryptjs";
import { MongoStorage } from "./db/MongoStorage";
import session from "express-session";
import { Store as SessionStore } from "express-session";

// Interface for storage operations
export interface IStorage {
  // Session store for authentication
  sessionStore: session.Store;

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByObjectId(objectId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserProfile(userId: number | string, profileData: UpdateProfile): Promise<User | undefined>;

  // Store operations
  getStore(id: number): Promise<Store | undefined>;
  getStoreByUserId(userId: number | string): Promise<Store | undefined>;
  getAllStores(): Promise<Store[]>;
  createStore(store: InsertStore): Promise<Store>;
  updateStore(id: number, storeData: Partial<Store>): Promise<Store | undefined>;

  // Product operations
  getProduct(id: string): Promise<Product | undefined>;
  getProductsByStoreId(storeId: string): Promise<Product[]>;
  getAllProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  createProductsFromCsv(products: ProductFromCsv[], storeId: string): Promise<Product[]>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  updateProductStock(productId: string, quantityChange: number): Promise<void>;

  // Count operations
  getProductCountByStoreId(storeId: number): Promise<number>;

  // Order operations
  createOrder(orderData: Order): Promise<Order>;
  getOrdersByUserId(userId: string): Promise<Order[]>;
  getOrderById(orderId: string): Promise<Order | undefined>;
  getOrdersByProductIds(productIds: string[]): Promise<Order[]>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private stores: Map<number, Store>;
  private products: Map<number, Product>;
  private currentUserId: number;
  private currentStoreId: number;
  private currentProductId: number;
  public sessionStore: SessionStore;

  constructor() {
    this.users = new Map();
    this.stores = new Map();
    this.products = new Map();
    this.currentUserId = 1;
    this.currentStoreId = 1;
    this.currentProductId = 1;

    // Create memory store for sessions
    const MemoryStore = require('memorystore')(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Prune expired entries every 24h
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByObjectId(objectId: string): Promise<User | undefined> {
    // In MemStorage, we don't have ObjectIds, so this is essentially a dummy implementation
    // that would always return undefined
    console.log("getUserByObjectId called in MemStorage - not implemented");
    return undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user: User = { 
      ...userData, 
      id, 
      password: hashedPassword,
      createdAt: new Date(),
      role: userData.role || 'user',
      fullName: null,
      profileImage: null,
      phoneNumber: null,
      address: null,
      bio: null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserProfile(userId: number | string, profileData: UpdateProfile): Promise<User | undefined> {
    const user = this.users.get(userId);

    if (!user) {
      return undefined;
    }

    const updatedUser: User = {
      ...user,
      ...profileData,
    };

    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Store operations
  async getStore(id: number): Promise<Store | undefined> {
    return this.stores.get(id);
  }

  async getStoreByUserId(userId: number | string): Promise<Store | undefined> {
    // Convert to string for comparison if needed
    const userIdStr = userId.toString();

    return Array.from(this.stores.values()).find(
      (store) => store.userId === userId || store.userId.toString() === userIdStr,
    );
  }

  async getAllStores(): Promise<Store[]> {
    return Array.from(this.stores.values());
  }

  async createStore(storeData: InsertStore): Promise<Store> {
    const id = this.currentStoreId++;
    const store: Store = { 
      ...storeData, 
      id,
      createdAt: new Date(),
      description: storeData.description || null,
      logo: storeData.logo || null
    };
    this.stores.set(id, store);
    return store;
  }

  // Product operations
  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductsByStoreId(storeId: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.storeId === storeId,
    );
  }

  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    const product: Product = { 
      ...productData, 
      id,
      createdAt: new Date(),
      description: productData.description || null,
      category: productData.category || null,
      sku: productData.sku || null,
      stock: productData.stock || 0,
      image: productData.image || null
    };
    this.products.set(id, product);
    return product;
  }

  async createProductsFromCsv(products: ProductFromCsv[], storeId: string): Promise<Product[]> {
    const createdProducts: Product[] = [];

    for (const productData of products) {
      const id = this.currentProductId++;
      const product: Product = {
        id,
        name: productData.name,
        description: productData.description || null,
        price: productData.price,
        category: productData.category || null,
        sku: productData.sku || null,
        stock: productData.stock,
        image: productData.image || null,
        storeId,
        createdAt: new Date(),
      };

      this.products.set(id, product);
      createdProducts.push(product);
    }

    return createdProducts;
  }

  async updateProduct(id: string, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);

    if (!product) {
      return undefined;
    }

    const updatedProduct: Product = {
      ...product,
      ...productData,
    };

    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.products.delete(id);
  }

  // Count operations
  async getProductCountByStoreId(storeId: number): Promise<number> {
    return Array.from(this.products.values()).filter(
      (product) => product.storeId === storeId,
    ).length;
  }

  // Order operations
  async createOrder(orderData: Order): Promise<Order> {
    // Implementation needed
    throw new Error("Method not implemented");
  }

  async getOrdersByUserId(userId: string): Promise<Order[]> {
    // Implementation needed
    throw new Error("Method not implemented");
  }

  async getOrderById(orderId: string): Promise<Order | undefined> {
    // Implementation needed
    throw new Error("Method not implemented");
  }

  async getOrdersByProductIds(productIds: string[]): Promise<Order[]> {
    // Implementation needed
    throw new Error("Method not implemented");
  }

  async updateProductStock(productId: string, quantityChange: number): Promise<void> {
    // Implementation needed
    throw new Error("Method not implemented");
  }
}

// Use MongoDB storage implementation instead of in-memory storage
export const storage = new MongoStorage();
