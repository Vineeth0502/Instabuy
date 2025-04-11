import express, { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User, updateProfileSchema } from "@shared/schema";
import { registerStoreRoutes } from "./controllers/store";
import { registerProductRoutes } from "./controllers/product";
import { registerCsvUploadRoutes } from "./controllers/csv-upload";
import { registerOrderRoutes } from "./controllers/order";

// Extend Express Request to include User
declare global {
  namespace Express {
    // Define User interface that extends the schema User type
    interface User {
      id?: number;
      _id?: any; // MongoDB ObjectId
      username: string;
      email: string;
      password: string;
      role: string;
      createdAt: Date | string | null;
    }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session middleware
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "instabuy-dev-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      secure: process.env.NODE_ENV === "production",
    },
  };

  app.use(session(sessionSettings));
  
  // Set up passport for authentication
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username: string, password: string, done: any) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          return done(null, false, { message: "Invalid username" });
        }

        const isMatch = await comparePasswords(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Invalid password" });
        }

        return done(null, user);
      } catch (error) {
        console.error("Authentication error:", error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user: any, done: (err: any, id?: number) => void) => {
    // Check if user is a plain object or a Mongoose document
    if (!user || (typeof user.id === 'undefined' && !user._id)) {
      console.error("Cannot serialize user - missing id property");
      return done(new Error("Cannot serialize user without an id"));
    }
    
    const userId = typeof user.id !== 'undefined' ? user.id : user._id.toString();
    console.log(`Serializing user ID: ${userId}`);
    done(null, userId);
  });
  
  passport.deserializeUser(async (id: number | string, done: (err: any, user?: Express.User | false) => void) => {
    try {
      // Always use MongoDB ObjectId for lookup
      let user;
      if (typeof id === 'string' && id.length === 24) {
        user = await storage.getUserByObjectId(id);
        if (user && !user.id) {
          user.id = 1; // Set default numeric ID if missing
        }
      } else {
        user = await storage.getUser(Number(id));
      }
      
      if (!user) {
        return done(null, false);
      }
      
      done(null, user);
    } catch (error) {
      console.error("Error deserializing user:", error);
      done(error);
    }
  });

  // API routes
  const apiRouter = express.Router();
  
  // Authentication routes
  apiRouter.post("/register", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash the password before saving
      const hashedPassword = await hashPassword(req.body.password);
      
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      // Login the user after registration
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  apiRouter.post("/login", (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("local", (err: any, user: Express.User | false, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid credentials" });
      
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  apiRouter.post("/logout", (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  apiRouter.get("/user", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    // Remove password from response
    const { password, ...userWithoutPassword } = req.user as User;
    
    res.json(userWithoutPassword);
  });
  
  // Update user profile
  apiRouter.put("/user/profile", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = req.user as User;
      const userId = typeof user.id !== 'undefined' ? user.id : (user as any)._id;
      
      console.log("Updating profile for user with ID:", userId);
      
      // Validate profile data against schema
      const validatedProfile = updateProfileSchema.parse(req.body);
      
      // Pass userId directly (can be number or string for MongoDB ObjectId)
      const updatedUser = await storage.updateUserProfile(userId, validatedProfile);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });
  
  // Store routes
  registerStoreRoutes(apiRouter, storage);
  
  // Product routes
  registerProductRoutes(apiRouter, storage);

  // CSV Upload routes
  registerCsvUploadRoutes(apiRouter, storage);
  
  // Order routes
  registerOrderRoutes(apiRouter, storage);
  
  // Mount all routes under /api
  app.use("/api", apiRouter);

  const httpServer = createServer(app);

  return httpServer;
}
