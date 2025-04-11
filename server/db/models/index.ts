import mongoose, { Document, Schema, Types } from 'mongoose';
import { User, Store, Product } from '../../../shared/schema';

// Define the document interfaces
export interface UserDocument extends Omit<User, 'id'>, Document {
  id: number;
}

export interface StoreDocument extends Omit<Store, 'id' | 'userId'>, Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  store_id: string;
}

export interface ProductDocument extends Omit<Product, 'id' | 'storeId'>, Document {
  id: number;
  storeId: Types.ObjectId;
}

// Define the User schema
const UserSchema = new Schema<UserDocument>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    default: 'user',
    enum: ['user', 'admin', 'seller']
  },
  fullName: {
    type: String,
    required: false,
    trim: true
  },
  profileImage: {
    type: String,
    required: false
  },
  phoneNumber: {
    type: String,
    required: false,
    trim: true
  },
  address: {
    type: String,
    required: false,
    trim: true
  },
  bio: {
    type: String,
    required: false,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Define the Store schema
const StoreSchema = new Schema<StoreDocument>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: false
  },
  logo: {
    type: String,
    required: false
  },
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  store_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Define the Product schema
const ProductSchema = new Schema<ProductDocument>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: false
  },
  price: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: false
  },
  category: {
    type: String,
    required: false
  },
  sku: {
    type: String,
    required: false
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  storeId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Store'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Define the Order schema
const OrderSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  items: [{
    productId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Product'
    },
    quantity: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    name: {
      type: String,
      required: true
    }
  }],
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create and export models
// Define interfaces for Order
export interface OrderDocument extends Document {
  userId: Types.ObjectId;
  items: {
    productId: Types.ObjectId;
    quantity: number;
    price: string;
    name: string;
  }[];
  total: number;
  status: string;
  createdAt: Date;
}

export const UserModel = mongoose.model<UserDocument>('User', UserSchema);
export const StoreModel = mongoose.model<StoreDocument>('Store', StoreSchema);
export const ProductModel = mongoose.model<ProductDocument>('Product', ProductSchema);
export const OrderModel = mongoose.model<OrderDocument>('Order', OrderSchema);