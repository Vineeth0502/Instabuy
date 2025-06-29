# 🛍️ Instabuy - Full Stack E-commerce Platform

Instabuy is a modern full-stack e-commerce application built using the MERN stack (MongoDB, Express, React, Node.js) with TypeScript, Zustand state management, TanStack React Query, and Tailwind CSS. It supports buyers and sellers, allowing users to register, manage carts, favorite items, and place orders, while sellers can create stores and manage their product inventory.

---

## 📦 Features

### 👤 User (Customer) Features
- User registration and authentication (JWT + sessions)
- Browse featured and recent products
- Add/remove products from cart (Zustand-based cart)
- Favorite/unfavorite products (Zustand-based favorites)
- Place orders with cart summary
- View past orders in dashboard
- Profile avatar and email display

### 🧑‍💼 Seller Features
- Seller authentication
- Store creation with logo upload
- Product management (add, edit, delete)
- CSV bulk upload of products
- View all orders made on their products (filtered by storeId)

### 💾 Backend
- Built on Express.js
- MongoDB via Mongoose (or Drizzle ORM if configured)
- Secure image and CSV upload with Multer
- Authentication via Passport.js and JWT middleware

### 💻 Frontend
- React with Vite + TypeScript
- Zustand for cart and favorites
- TanStack React Query for API data fetching
- Tailwind CSS with shadcn/ui components
- Wouter for routing

---

## 🚀 Project Setup Instructions

### Prerequisites
- Node.js >= 18.x
- MongoDB Atlas URI or local MongoDB instance
- Yarn or npm

### 1. Clone the Repo
```bash
git clone https://github.com/yourusername/instabuy.git
cd instabuy
```

### 2. Install Dependencies
```bash
# At the root
npm install

# For client and server separately (if split)
cd Instabuy
npm install
```

### 3. Environment Variables
Create a `.env` file at the root level:
```bash
MONGO_URI=mongodb://localhost:27017/instabuy
SESSION_SECRET=yourSecret
JWT_SECRET=yourJWTSecret
```

### 4. Start the Server
```bash
cd Instabuy
npm run dev  # Runs both client and server
```

> Alternatively use `concurrently` or `vite` + `nodemon` separately.

---

## 🧠 Detailed Project Flow

### 🔐 Authentication
- `use-auth.tsx` manages auth context and API sessions
- Session-based login via `/api/login` and `/api/logout`

### 🛒 Cart Logic
- `use-cart.ts` uses Zustand and localStorage persistence
- Supports quantity update, item removal, and `clearCart()`
- Total price and item count are computed dynamically

### ❤️ Favorites
- `use-favorites.tsx` tracks favorited products per user
- Favorites are persisted using Zustand + localStorage

### 🧾 Order Placement
- Orders placed from cart are POSTed to `/api/orders`
- Backend validates stock, updates product quantity, and saves the order
- `clearCart()` is called after successful placement

### 📦 Order History
- Orders fetched on user dashboard from `/api/orders`
- Orders displayed in a clean table (date, total, status)
- Uses React Query to handle fetching and state

### 🛍️ Seller Store & Products
- Seller creates a store (only one per user)
- Can add/edit/delete products under their store
- CSV upload endpoint supports bulk product creation
- Sellers fetch orders that include their products

### 🖼️ Uploads
- Images stored in `/uploads/images`
- Uses Multer middleware in Express

---

## 📁 Project Structure

```
Instabuy/
├── client/              # React + Vite frontend
│   ├── src/
│   │   ├── hooks/
│   │   ├── components/
│   │   ├── pages/
│   │   └── context/
├── server/              # Express backend
│   ├── controllers/
│   ├── middleware/
│   ├── db/
│   └── routes.ts
├── shared/              # Shared types/interfaces
├── uploads/             # Image uploads
├── .env
├── package.json
└── vite.config.ts
```

---

## 🛠️ Development Notes

### ✅ Fixed Issues:
- `clearCart` undefined error → fixed by adding it to the `useCart` destructuring
- Orders now reflect correctly in both user and seller dashboards
- Favorites now use string `_id` consistently instead of number

### 🧪 Tested Workflows:
- Add to cart and remove
- Place order and verify backend logs
- Refresh dashboard to get updated stock and orders

---

## 📬 API Endpoints Summary

### 📦 Products
- `GET /api/products/featured`
- `GET /api/products/recent`

### 🛒 Cart & Orders
- `POST /api/orders`
- `GET /api/orders` (user-specific)
- `GET /api/orders/seller` (seller-specific)

### 🛍️ Stores
- `GET /api/stores`
- `GET /api/store/seller` – get logged-in seller's store
- `POST /api/store` – create a new store

### 👤 Auth
- `POST /api/login`
- `POST /api/logout`
- `GET /api/user`

---

## 📚 Credits & Tools
- Zustand – state management
- TanStack React Query – API data management
- Tailwind CSS + shadcn/ui – UI framework
- Vite – frontend bundler
- Express.js – backend server
- MongoDB – NoSQL database

---

## 🧩 Future Improvements
- Stripe integration for real payments
- Email notifications
- Product reviews and ratings
- Admin dashboard for moderation

---

## 🧑‍💻 Authors
- Vineeth Ketham (Full Stack Developer)

---

## 📜 License
MIT License – Free to use and modify.

