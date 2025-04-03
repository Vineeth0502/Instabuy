import { IStorage } from '../storage';
import { 
  User, InsertUser, UpdateProfile,
  Store, InsertStore,
  Product, InsertProduct,
  ProductFromCsv
} from '../../shared/schema';
import { 
  UserModel, 
  StoreModel, 
  ProductModel 
} from './models';
import session from 'express-session';
import mongoose from 'mongoose';
import { Store as SessionStore } from 'express-session';
import createMemoryStore from 'memorystore';

export class MongoStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    // Create memory store for sessions
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Prune expired entries every 24h
    });
  }
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      const user = await UserModel.findOne({ id });
      return user ? user.toObject() : undefined;
    } catch (error) {
      console.error('Error retrieving user:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const user = await UserModel.findOne({ email });
      return user ? user.toObject() : undefined;
    } catch (error) {
      console.error('Error retrieving user by email:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const user = await UserModel.findOne({ username });
      return user ? user.toObject() : undefined;
    } catch (error) {
      console.error('Error retrieving user by username:', error);
      return undefined;
    }
  }

  async getUserByObjectId(objectId: string): Promise<User | undefined> {
    try {
      console.log("Looking for user with objectId:", objectId);
      const user = await UserModel.findById(objectId);

      if (!user) {
        console.log("No user found with objectId:", objectId);
        return undefined;
      }

      // Convert to plain object
      const userObj = user.toObject();

      // Make sure user has numeric id property (this is used by authentication middleware)
      if (!userObj.id || userObj.id === undefined) {
        console.log("User found but missing numeric id, assigning one");

        // Check if this is a new user and assign a sequential id
        const latestUser = await UserModel.findOne().sort({ id: -1 });
        const newId = latestUser && typeof latestUser.id === 'number' ? latestUser.id + 1 : 1;

        console.log(`Assigning new numeric id ${newId} to user ${userObj.username}`);

        // Update the user document with the id
        await UserModel.findByIdAndUpdate(objectId, { id: newId });

        // Add the id to our return object
        userObj.id = newId;
      }

      // IMPORTANT: Ensure id is a number to match expected type
      if (!userObj.id || userObj.id === undefined) {
        // If no numeric id is available, use a default ID
        // We can't use the string MongoDB ObjectId as id because User.id is typed as number
        console.log("User has no numeric id, using default");
        userObj.id = 9999; // Use a large default number that's unlikely to conflict
      }

      // Ensure id is always a number
      if (typeof userObj.id === 'string') {
        // Convert string id to number if possible
        userObj.id = parseInt(userObj.id, 10) || 9999;
      }

      console.log("Returning user with data:", { 
        id: userObj.id, 
        username: userObj.username,
        _id: userObj._id
      });

      return userObj;
    } catch (error) {
      console.error('Error retrieving user by ObjectId:', error);
      return undefined;
    }
  }

  async createUser(userData: InsertUser): Promise<User> {
    try {
      // Get the latest user id
      const latestUser = await UserModel.findOne().sort({ id: -1 });
      const newId = latestUser ? latestUser.id + 1 : 1;

      const newUser = new UserModel({
        ...userData,
        id: newId,
        createdAt: new Date().toISOString()
      });

      await newUser.save();
      return newUser.toObject();
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUserProfile(userId: number | string, profileData: UpdateProfile): Promise<User | undefined> {
    try {
      console.log("Updating profile for userId:", userId);

      let updatedUser;

      // Check if userId is a MongoDB ObjectId string (24 chars hex)
      if (typeof userId === 'string' && /^[0-9a-fA-F]{24}$/.test(userId)) {
        console.log("Updating by MongoDB _id");
        updatedUser = await UserModel.findByIdAndUpdate(
          userId,
          { $set: profileData },
          { new: true }
        );
      } else {
        console.log("Updating by numeric id field");
        updatedUser = await UserModel.findOneAndUpdate(
          { id: userId },
          { $set: profileData },
          { new: true }
        );
      }

      if (!updatedUser) {
        console.log("User not found for profile update");
        return undefined;
      }

      console.log("Profile updated successfully");
      return updatedUser.toObject();
    } catch (error) {
      console.error('Error updating user profile:', error);
      return undefined;
    }
  }

  // Store operations
  async getStore(id: number): Promise<Store | undefined> {
    try {
      const store = await StoreModel.findOne({ id });
      return store ? store.toObject() : undefined;
    } catch (error) {
      console.error('Error retrieving store:', error);
      return undefined;
    }
  }

  async getAllStores(): Promise<Store[]> {
    const stores = await StoreModel.find({}).lean();
    return stores.map(store => ({
      ...store,
      id: store._id.toString(),
    }));
  }

  async getStoreByUserId(userId: string): Promise<Store | undefined> {
    try {
      const objectId = new mongoose.Types.ObjectId(userId);
      const store = await StoreModel.findOne({ userId: objectId }).exec();
      
      if (!store) {
        return undefined;
      }
      
      const storeObj = store.toObject();
      return {
        ...storeObj,
        id: storeObj.store_id,
        userId: userId,
        _id: storeObj._id.toString()
      };
    } catch (error) {
      console.error('Error getting store by userId:', error);
      return undefined;
    }
  }

  async getStoreByStoreId(storeId: string): Promise<Store | undefined> {
    try {
      const store = await StoreModel.findById(storeId).exec();
      if (!store) {
        return undefined;
      }
      const storeObj = store.toObject();
      return {
        ...storeObj,
        id: storeObj.store_id,
        _id: storeObj._id.toString()
      };
    } catch (error) {
      console.error('Error getting store by storeId:', error);
      return undefined;
    }
  }

  async updateStore(id: number, storeData: Partial<Store>): Promise<Store | undefined> {
    try {
      const updatedStore = await StoreModel.findOneAndUpdate(
        { id },
        { $set: storeData },
        { new: true }
      );
      return updatedStore ? updatedStore.toObject() : undefined;
    } catch (error) {
      console.error('Error updating store:', error);
      return undefined;
    }
  }

  async createStore(storeData: any): Promise<Store> {
    try {
      console.log("Creating store with data:", storeData);

      // Get the latest store id
      const latestStore = await StoreModel.findOne().sort({ id: -1 });
      const newId = latestStore ? latestStore.id + 1 : 1;

      // Handle MongoDB ObjectId if userId is a string
      let userId = storeData.userId;
      if (typeof userId === 'string' && /^[0-9a-fA-F]{24}$/.test(userId)) {
        // This is a MongoDB ObjectId string
        console.log("Converting string userId to MongoDB ObjectId:", userId);
        try {
          userId = new mongoose.Types.ObjectId(userId);
        } catch (e) {
          console.error("Failed to convert to ObjectId, keeping as string:", e);
        }
      }

      const newStore = new StoreModel({
        ...storeData,
        userId: userId,
        id: newId,
        createdAt: new Date().toISOString()
      });

      console.log("Saving new store:", newStore);
      await newStore.save();

      const storeObject = newStore.toObject();
      console.log("Created store:", storeObject);

      return storeObject;
    } catch (error) {
      console.error('Error creating store:', error);
      throw error;
    }
  }

  // Product operations
  async getProduct(id: string): Promise<Product | undefined> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid ObjectId format');
      }
      const product = await ProductModel.findById(id);
      return product ? product.toObject() : undefined;
    } catch (error) {
      console.error('Error retrieving product:', error);
      throw error; // Let the controller handle the error
    }
  }

  async getProductsByStoreId(storeId: string | number): Promise<Product[]> {
    try {
      let searchCriteria;
      if (typeof storeId === 'string') {
        if (/^[0-9a-fA-F]{24}$/.test(storeId)) {
          searchCriteria = { storeId: new mongoose.Types.ObjectId(storeId) };
        } else {
          // Try to find store first to get ObjectId
          const store = await this.getStoreByStoreId(storeId);
          if (!store) return [];
          searchCriteria = { storeId: new mongoose.Types.ObjectId(store._id) };
        }
      } else {
        searchCriteria = { storeId };
      }

      const products = await ProductModel.find(searchCriteria).sort({ createdAt: -1 });
      return products.map(product => product.toObject());
    } catch (error) {
      console.error('Error retrieving products by storeId:', error);
      return [];
    }
  }

  async getAllProducts(): Promise<Product[]> {
    try {
      const products = await ProductModel.find()
        .populate('storeId', 'name logo')
        .sort({ createdAt: -1 });
      return products.map(product => {
        const obj = product.toObject();
        return {
          ...obj,
          store: obj.storeId
        };
      });
    } catch (error) {
      console.error('Error retrieving all products:', error);
      return [];
    }
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    try {
      console.log("\n=== MongoStorage.createProduct ===");
      console.log("Input product data:", productData);

      if (!productData.storeId || typeof productData.storeId !== 'string') {
        console.error("❌ Store ID validation failed:", { storeId: productData.storeId, type: typeof productData.storeId });
        throw new Error("Valid store ID string is required");
      }

      if (!/^[0-9a-fA-F]{24}$/.test(productData.storeId)) {
        console.error("❌ Invalid ObjectId format:", productData.storeId);
        throw new Error("Invalid store ID format - must be a valid ObjectId");
      }

      try {
        console.log("🔍 Looking up store with ID:", productData.storeId);
        const store = await StoreModel.findById(productData.storeId);
        if (!store) {
          console.error("❌ Store not found for ID:", productData.storeId);
          throw new Error("Store not found");
        }
      } catch (err) {
        console.error("❌ Store ID validation error:", err);
        throw new Error("Invalid store ID");
      }

      const latestProduct = await ProductModel.findOne().sort({ id: -1 });
      const newId = latestProduct ? latestProduct.id + 1 : 1;

      const newProduct = new ProductModel({
        ...productData,
        id: newId,
        storeId: new mongoose.Types.ObjectId(productData.storeId),
        createdAt: new Date().toISOString()
      });

      console.log("✅ Creating product:", { id: newId, name: productData.name });
      await newProduct.save();
      return newProduct.toObject();
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  async createProductsFromCsv(products: ProductFromCsv[], storeId: string): Promise<Product[]> {
    try {
      if (!storeId || !/^[0-9a-fA-F]{24}$/.test(storeId)) {
        throw new Error("Invalid store ID format - must be a valid ObjectId");
      }
      const storeObjectId = new mongoose.Types.ObjectId(storeId);
      
      // Get the latest product id
      const latestProduct = await ProductModel.findOne().sort({ id: -1 });
      let nextId = latestProduct ? latestProduct.id + 1 : 1;

      const createdProducts: Product[] = [];

      for (const productData of products) {
        const newProduct = new ProductModel({
          ...productData,
          id: nextId++,
          storeId: storeObjectId,
          createdAt: new Date().toISOString()
        });

        await newProduct.save();
        createdProducts.push(newProduct.toObject());
      }

      return createdProducts;
    } catch (error) {
      console.error('Error creating products from CSV:', error);
      throw error;
    }
  }

  async updateProduct(id: string, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    try {
      console.log('=== MongoStorage.updateProduct ===');
      console.log('Product ID:', id);
      console.log('Update data:', productData);

      if (!mongoose.Types.ObjectId.isValid(id)) {
        console.error('Invalid ObjectId format:', id);
        throw new Error('Invalid ObjectId format');
      }

      // Remove any attempts to update the _id
      const { _id, ...updateData } = productData;

      const updatedProduct = await ProductModel.findByIdAndUpdate(
        new mongoose.Types.ObjectId(id),
        { $set: updateData },
        { new: true }
      );

      console.log('Updated product:', updatedProduct);

      return updatedProduct ? updatedProduct.toObject() : undefined;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error; // Let the controller handle the error
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      const result = await ProductModel.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      console.error('Error deleting product:', error);
      return false;
    }
  }

  // Count operations
  async getProductCountByStoreId(storeId: number): Promise<number> {
    try {
      return await ProductModel.countDocuments({ storeId });
    } catch (error) {
      console.error('Error counting products by storeId:', error);
      return 0;
    }
  }

    //Helper functions (missing in original code) - added for compilation
    private async getNextId(collection: string): Promise<number> {
        const model = collection === 'store' ? StoreModel : (collection === 'user' ? UserModel : null);
        if (!model) throw new Error(`Invalid collection: ${collection}`);
        const latest = await model.findOne().sort({ id: -1 });
        return (latest?.id || 0) + 1;
    }
    private convertToPlainStore(store: any): Store {
        return { ...store.toObject(), id: store.id };
    }
}